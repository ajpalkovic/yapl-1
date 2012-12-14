!function($) {
  var CheckVarsDefinedPass = klass(pass, pass.ScopedTransformer, {
    initialize: function CheckVarsDefinedPass() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'identifier_reference': this.onIdentifier,
        'member_identifier': this.onMemberIdentifier,
        'accessor_variable': this.onAccessorVariable,
        'property_access': this.onPropertyAccess,
        'function_declaration': this.onFunction,
        'function_expression': this.onFunction,
        'method': this.onFunction
      });
    },

    onDeclaration: function(symbolName, declaration, scope) {
      // We don't allow variable shadowing except for closure params.
      var shadowsVariable = scope.hasSymbol(symbolName) && !declaration.is('closure_parameter');

      if (shadowsVariable) {
        var line = declaration.name.line;

        // throw new error.ShadowedReference(line, symbolName);
      }
    },

    onInstanceDeclaration: function(symbolName, declaration, scope) {
      var shadowsInstanceDeclaration = scope.classContext
        && scope.classContext.isInContext(symbolName)
        && !declaration.parent.is('auto_set_param');

      if (shadowsInstanceDeclaration) {
        var line = declaration.name.line;

        throw new error.ShadowedReference(line, symbolName);
      }
    },

    onIdentifier: function(identifierReference, scope) {
      var name = identifierReference.name;

      // If the identifier is a closure alias parameter, then we need to check the parent scope
      // for the declaration, because unlike other variable declarations that are lifted to the
      // top of the scope, we need to make sure this variable declaration aliases another one.
      if (identifierReference.parent.is('closure_parameter')) scope = scope.parentScope;

      if (!scope.hasSymbol(name.value)) {
        // If the symbol is not in scope, it can be either a static method/var or an instance
        // method/var.
        if (!(scope.classContext && scope.classContext.isInContext(name.value))) {
          throw new error.ReferenceError(name.line, name.value);
        }
      }
    },

    onMemberIdentifier: function(memberIdentifier, scope) {
      var name = memberIdentifier.name;

      if (!(scope.context && scope.context.isInContext(name.value))) {
        var contextName = scope.context ? scope.context.declaration.name.value : 'global';

        throw new error.NotInContextError(name.line, name.value, contextName);
      }
    },

    onAccessorVariable: function(accessorVariable, scope) {
      var name = accessorVariable.name;

      if (!scope.classContext.isInContext(name.value)) {
        var contextName = scope.classContext.declaration.name.value;

        throw new error.InvalidAccessor(name.line, name.value);
      }
    },

    onPropertyAccess: function(propertyAccess, scope) {
      if (propertyAccess.memberPart.is('property_access')) {
        this.onPropertyAccess(propertyAccess.children('.memberPart'), scope);
      }

      if (propertyAccess.memberPart.is('identifier_reference')) {
        var name = propertyAccess.memberPart.name.value;

        // If the symbol wasn't in scope, then one of the other handlers will handle
        // the error.
        if (scope.hasSymbol(scope)) {
          var declaration = scope.lookup(name);

          if (declaration.is('class_declaration')) {
            // TODO: need to be able to check accessor methods.
          }
        }
      }
    },

    onFunction: function(functionElement, scope) {
      // declares the default 'arguments' array for the function arguments
      scope.set('arguments', new Node('variable_declaration', {
        name: new TokenNode('arguments')
      }));
    }
  });
}(jQuery);