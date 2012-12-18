!function() {
  pass = {};

  var Pass = klass(pass, {}, {
    initialize: function Pass(selectorMappings) {
      this.selectorMappings = selectorMappings;
    },

    run: function(ast, compiler) {},

    handleMatch: function(match, fn, compiler) {
      fn.call(this, match, compiler);
    }
  });

  var Transformer = klass(pass, Pass, {
    initialize: function Transformer(selectorMappings) {
      pass.Pass.prototype.initialize.call(this, selectorMappings);
    },

    handleMatch: function(match, fn, compiler) {
      var replacement = fn.call(this, match, compiler);
      if (replacement === undefined) return;

      if (replacement !== match) match.replaceWith(replacement);
    }
  });

  var ScopedPass = klass(pass, Pass, {
    initialize: function ScopedPass(selectorMappings) {
      pass.Pass.prototype.initialize.call(this, selectorMappings);

      this.scopeSelector = [
        'class_declaration',
        'function_declaration',
        'function_expression',
        'proc',
        'closure',
        'method',
        'static_method',
        'catch'
      ];

      this.declarationSelector = [
        'class_declaration',
        'variable_declaration',
        'exception_var_declaration',
        'method',
        'static_method',
        'instance_var_declaration',
        'static_var_declaration',
        'closure_parameter',
        'function_declaration',
        'function_expression',
      ];

      // We don't want any static methods or variables.
      this.instanceDeclarationSelector = [
        'method',
        'instance_var_declaration',
      ];

      this.staticDeclarationSelector = [
        'static_method',
        'static_var_declaration'
      ];
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

      _this.selectorMappings.each(function(selector, fn) {
        if (node.is(selector)) _this.handleMatch(node, fn, scope, compiler);
      });

      node.each(function(child) {
        if (child.is(_this.scopeSelector)) {
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
        if (child.is(_this.declarationSelector)) {
          var symbolName = child.name.value

          if (_this.onDeclaration) {
            // We treat statics like regular variables
            if (!child.is(_this.instanceDeclarationSelector) || child.is(_this.staticDeclarationSelector)) {
              _this.onDeclaration(symbolName, child, scope, compiler);
            } else {
              _this.onInstanceDeclaration(symbolName, child, scope, compiler);
            }
          }

          // Anonymous function expressions don't have a name.
          if (symbolName) {
            // Statics get treated as instance data and regular variables.
            if (child.is(_this.staticDeclarationSelector)) {
              scope.set(symbolName, child);
              scope.classContext.declare(child);
            } else if (child.is(_this.instanceDeclarationSelector)) {
              scope.classContext.declare(child);
            } else {
              scope.set(symbolName, child);
            }
          }
        }

        // We only traverse down if the child does not signify a new
        // lexical scope.
        if (!child.is(_this.scopeSelector)) _this.liftDeclarations(child, scope, compiler);
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
        if (replacement) this.traverseChildren(replacement, scope, compiler);
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