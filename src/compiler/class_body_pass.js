!function() {
  var PROTOTYPE_TOKEN = new TokenNode('prototype');
  var CALL_TOKEN = new TokenNode('call');

  var CONSTRUCTOR_NAME = 'initialize';

  function makeThisReference(nameToken) {
    return new Node('property_access', {
      member: new Node('this', [new TokenNode(Token.THIS)]),
      memberPart: nameToken
    });
  }

  var ClassBodyTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function ClassBodyTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'class_body': this.onClassBody,
        'member_identifier': this.onMemberIdentifier,
        'super': this.onSuper,
        'identifier_reference': this.onIdentifier,
        'accessor': this.onAccessor,
        'instance_var_declaration_statement': this.onInstanceVarDeclarationStatement,
        'auto_set_param': this.onAutoSetParam
      });
    },

    onClassBody: function(classBody, scope) {
      var constructorMethod = scope.classContext.methods[CONSTRUCTOR_NAME];

      if (!constructorMethod) {
        constructorMethod = new Node('method', {
          name: new TokenNode(CONSTRUCTOR_NAME),
          parameters: new NodeList('parameter_list'),
          body: new NodeList('function_body')
        });

        scope.classContext.declare(constructorMethod);
        classBody.append(constructorMethod);
      }

      constructorMethod.tagAs('constructor');
    },

    onMemberIdentifier: function(memberIdentifier, scope) {
      return makeThisReference(memberIdentifier.name);
    },

    onSuper: function(superCall, scope) {
      var className = scope.context.declaration.name;
      var parentClass = scope.context.declaration.parentClass;

      if (parentClass.isNull()) {
        throw new error.NoSuperClassError(superCall.line, className.value);
      }

      var method = superCall.closest('method');
      var isCall = superCall.parent.is('call');
      var isConstructor = method.is('constructor');

      var superObject = isConstructor ? parentClass.clone() : new Node('property_access', {
        member: parentClass,
        memberPart: PROTOTYPE_TOKEN
      });

      if (!isCall) return superObject;

      var arguments = superCall.parent.memberPart;
      arguments.prepend(new Node('this', [new TokenNode(Token.THIS)]));

      var superMethodCall = isConstructor ? CALL_TOKEN : new Node('property_access', {
        member: methodName,
        memberPart: CALL_TOKEN
      });

      return new Node('property_access', {
        member: superObject,
        memberPart: superMethodCall
      });
    },

    onIdentifier: function(identifierReference, scope) {
      var name = identifierReference.name;

      // Handle static variables. We need to look at any parent contexts too, in case a nested
      // class is using a static variable of a parent class.
      while (scope && scope.classContext) {
        if (scope.classContext.isInContext(name.value)) {
          var declaration = scope.classContext.lookup(name.value);

          if (declaration.is('static_method') || declaration.is('static_var_declaration')) {
            return new Node('property_access', {
              member: scope.classContext.declaration.name,
              memberPart: declaration.name
            });
          } else if (declaration.is('method')) {
            return makeThisReference(declaration.name);
          }
        }

        scope = scope.parentScope;
      }
    },

    onInstanceVarDeclarationStatement: function(instanceVarDeclarationStatement, scope) {
      var instanceVarDeclarations = instanceVarDeclarationStatement.instanceVarDeclarationList;

      instanceVarDeclarations.each(function(instanceVarDeclaration) {
        var name = instanceVarDeclaration.name;
        var value = instanceVarDeclaration.value.isNull()
          ? new TokenNode(Token.UNDEFINED) : instanceVarDeclaration.value;

        var constructorMethod = scope.classContext.methods[CONSTRUCTOR_NAME];
        var doDeclaration = true;

        constructorMethod.parameters.each(function(parameter) {
          if (parameter.is('auto_set_param')) {
            var parameterName = parameter.variableDeclaration.name;

            // We don't want to double declare/assign an instance variable if it
            // will be auto-assigned in the constructor anyway.
            if (name.value === parameterName.value) {
              doDeclaration = false;
              return;
            }
          }
        });

        if (doDeclaration) {
          var memberAssign = Node.statement(
            Node.assignment(new Node('member_identifier', {
              name: name
            }),
            value
          ));

          constructorMethod.body.prepend(memberAssign);
        }
      });

      return null;
    },

    onAutoSetParam: function(autoSetParam, scope) {
      var body = autoSetParam.closest('method').body;
      var name = autoSetParam.variableDeclaration.name;
      var value = autoSetParam.variableDeclaration.value;

      if (!scope.classContext.instanceVariables[name.value]) {
        throw new error.NoMemberToSet(name.line, name.value);
      }

      // We need to handle the default argument possibility
      value = value.notNull() ? new Node('simple_expression', {
        left: name,
        operator: new TokenNode(Token.LOGICAL_OR),
        right: value
      }) : name;

      var setStatement = Node.statement(Node.assignment(makeThisReference(name), value));
      body.prepend(setStatement);

      // Needs to be a variable declaration to be consistent
      return new Node('variable_declaration', {
        name: name,
        value: null
      });
    },

    onAccessor: function(accessor, scope) {
      var classBody = accessor.parent;
      var type = accessor.type;
      var variables = accessor.variables;
      var typeMap = {
        'gets': makeGetter,
        'sets': makeSetter,
        'accesses': makeAccessor
      };

      function makeNameToken(prefix, name) {
        return new TokenNode(prefix + name.charAt(0).toUpperCase() + name.substring(1));
      }

      function methodAlreadyExists(methodName) {
        return scope.classContext.isInContext(methodName);
      }

      function makeGetter(variable) {
        var name = variable.name;
        var getterName = makeNameToken('get', name.value);

        if (methodAlreadyExists(getterName.value)) return;

        var getter = new Node('method', {
          name: getterName,
          parameters: new NodeList('parameter_list'),
          body: new NodeList('function_body', [
            Node.statement(
              new Node('keyword_statement', {
                keyword: new TokenNode(Token.RETURN),
                expression: new Node('member_identifier', {name: name})
              })
            )
          ])
        });

        // Handle the member identifier
        this.handleMatch(getter.body.children()[0].statement.expression, this.onMemberIdentifier, scope);
        return getter;
      }

      function makeSetter(variable) {
        var name = variable.name;
        var setterName = makeNameToken('set', name.value);

        if (methodAlreadyExists(setterName.value)) return;

        var setter = new Node('method', {
          name: setterName,
          parameters: new NodeList('parameter_list', [
            new Node('auto_set_param', [
              new Node('variable_declaration', {
                name: name,
                value: null
              })
            ])
          ]),
          body: new NodeList('function_body')
        });

        // We can just let the auto-setting param logic do this for us.
        this.handleMatch(setter.parameters.children()[0], this.onAutoSetParam, scope);
        return setter;
      }

      function makeAccessor(variable) {
        var getter = makeGetter.call(this, variable);
        var setter = makeSetter.call(this, variable);
        var methods = [];

        if (getter) methods.push(getter);
        if (setter) methods.push(setter);

        return methods;
      }

      var _this = this;
      variables.each(function(variable) {
        var methods = typeMap[type.value].call(_this, variable);
        classBody.append.apply(classBody, methods);
      });

      return null;
    }
  });
}();
