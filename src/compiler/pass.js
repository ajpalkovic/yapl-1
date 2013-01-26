!function() {
  pass = {};

  TagNumbers = {
    'catch': 1 << 0,
    class_declaration: 1 << 1,
    closure: 1 << 2,
    closure_parameter: 1 << 3,
    exception_var_declaration: 1 << 4,
    function_declaration: 1 << 5,
    function_expression: 1 << 6,
    instance_var_declaration: 1 << 7,
    method: 1 << 8,
    proc: 1 << 9,
    static_method: 1 << 10,
    static_var_declaration: 1 << 11,
    variable_declaration: 1 << 12
  };

  TagNumbers.scopeSelector = TagNumbers['class_declaration'] | TagNumbers['function_declaration'] |
      TagNumbers['function_expression'] | TagNumbers['proc'] | TagNumbers['closure'] |
      TagNumbers['method'] | TagNumbers['static_method'] | TagNumbers['catch'];

  TagNumbers.declarationSelector = TagNumbers['class_declaration'] | TagNumbers['variable_declaration'] |
      TagNumbers['exception_var_declaration'] | TagNumbers['method'] |
      TagNumbers['static_method'] | TagNumbers['instance_var_declaration'] |
      TagNumbers['static_var_declaration'] | TagNumbers['closure_parameter'] |
      TagNumbers['function_declaration'] | TagNumbers['function_expression'];

  // We don't want any static methods or variables.
  TagNumbers.instanceDeclarationSelector =
    TagNumbers['method'] | TagNumbers['instance_var_declaration'];

  TagNumbers.staticDeclarationSelector =
    TagNumbers['static_method'] | TagNumbers['static_var_declaration'];

  var Pass = klass(pass, {}, {
    initialize: function Pass(selectorMappings) {
      this.selectorMappings = selectorMappings;
    },

    run: function(ast, compiler) {
      this.traverseChildren(ast, compiler);
    },

    traverseChildren: function(node, compiler) {
      var _this = this;

      this.selectorMappings.each(function(selector, fn) {
        if (node.is(selector)) _this.handleMatch(node, fn, compiler);
      });

      node.each(function(child) {
        _this.traverseChildren(child, compiler);
      });
    },

    handleMatch: function(match, fn, compiler) {
      fn.call(this, match, compiler);
    }
  });

  var Transformer = klass(pass, Pass, {
    initialize: function Transformer(selectorMappings) {
      pass.Pass.prototype.initialize.call(this, selectorMappings);
    },

    handleMatch: function(match, fn, compiler) {
      var replacement = fn.call(this, match, scope, compiler);
      if (replacement === undefined) return;

      if (replacement !== match) {
        match.replaceWith(replacement);

        // Could be 'null', which signifies a deletion, so don't traverse.
        if (replacement) {
          var _this = this;

          // We do the iteration over the replacement's child so that
          // the replacement itself doesn't get re-matched by the current pass
          // into infinite recursion.
          replacement.each(function(child) {
            _this.traverseChildren(child, scope, compiler);
          });
        }
      }
    }
  });

  var ScopedPass = klass(pass, Pass, {
    initialize: function ScopedPass(selectorMappings) {
      pass.Pass.prototype.initialize.call(this, selectorMappings);
    },

    runWithScopeNode: function(scopeNode, scope, compiler) {
      // If the current node creates a new lexical scope,
      // create a new scope and add it to its own scope.
      var classContext = scopeNode.is('class_declaration') ? new Context(scopeNode) : undefined;
      var context = scopeNode.is('method') ? scope.classContext : undefined;

      scope = scope.subscope(classContext, context);

      // Lift all declarations in the current node into scope.
      this.liftDeclarations(scopeNode, scope, compiler);
      this.traverseChildren(scopeNode, scope, compiler);
    },

    traverseChildren: function(node, scope, compiler) {
      var _this = this;

      this.selectorMappings.each(function(selector, fn) {
        if (node.is(selector)) _this.handleMatch(node, fn, scope, compiler);
      });

      node.each(function(child) {
        if (child.isAnyOf(TagNumbers.scopeSelector)) {
          _this.runWithScopeNode(child, scope, compiler);
        } else {
          _this.traverseChildren(child, scope, compiler);
        }
      });
    },

    liftDeclarations: function(currentNode, scope, compiler) {
      var _this = this;

      currentNode.each(function(child) {
        // If the child is a declaration, add it to the symbol table.
        if (child.isAnyOf(TagNumbers.declarationSelector)) {
          var symbolName = child.name.value

          if (_this.onDeclaration) {
            // We treat statics like regular variables
            if (!child.isAnyOf(TagNumbers.instanceDeclarationSelector) || child.isAnyOf(TagNumbers.staticDeclarationSelector)) {
              _this.onDeclaration(symbolName, child, scope, compiler);
            } else {
              _this.onInstanceDeclaration(symbolName, child, scope, compiler);
            }
          }

          // Anonymous function expressions don't have a name.
          if (symbolName) {
            // Statics get treated as instance data and regular variables.
            if (child.isAnyOf(TagNumbers.staticDeclarationSelector)) {
              scope.set(symbolName, child);
              scope.classContext.declare(child);
            } else if (child.isAnyOf(TagNumbers.instanceDeclarationSelector)) {
              scope.classContext.declare(child);
            } else {
              scope.set(symbolName, child);
            }
          }
        }

        // We only traverse down if the child does not signify a new
        // lexical scope.
        if (!child.isAnyOf(TagNumbers.scopeSelector)) _this.liftDeclarations(child, scope, compiler);
      });
    },

    run: function(ast, compiler) {
      this.runWithScopeNode(ast, new Scope(), compiler);
    }
  });

  var ScopedTransformer = klass(pass, ScopedPass, {
    initialize: function ScopedTransformer(selectorMappings) {
      pass.ScopedPass.prototype.initialize.call(this, selectorMappings);
    },

    handleMatch: function(match, fn, scope, compiler) {
      var replacement = fn.call(this, match, scope, compiler);
      if (replacement === undefined) return;

      if (replacement !== match) {
        match.replaceWith(replacement);

        // Could be 'null', which signifies a deletion, so don't traverse.
        if (replacement) {
          var _this = this;

          // We do the iteration over the replacement's child so that
          // the replacement itself doesn't get re-matched by the current pass
          // into infinite recursion.
          replacement.each(function(child) {
            _this.traverseChildren(child, scope, compiler);
          });
        }
      }
    }
  });

  var EmitterPass = klass(pass, Pass, {
    initialize: function EmitterPass(selectorMappings) {
      Pass.prototype.initialize.call(this, selectorMappings);
    },

    run: function(ast, compiler) {
      var emitter = new Emitter(this.runWithEmitter.bind(this));
      this.runWithEmitter(ast, emitter, compiler);

      return emitter;
    },

    runWithEmitter: function(node, emitter, compiler) {
      var _this = this;
      this.selectorMappings.each(function(selector, fn) {
        if (node.is(selector)) fn.call(_this, node, emitter, compiler);
      });
    }
  });
}();
