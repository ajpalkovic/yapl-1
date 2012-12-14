!function($) {
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
      return makeThisReference(memberIdentifier.token);
    },

    onSuper: function(superCall, scope) {
      var className = scope.context.declaration.name;
      var parentClass = scope.context.declaration.parentClass;

      if (!parentClass) {
        throw new error.NoSuperClassError(superCall.line, className.value);
      }

      var method = superCall.closest('method');
      var call = superCall.parent.is('call');
      var isConstructor = method.is('constructor');

      var superObject = isConstructor ? parentClass.clone() : new Node('property_access', {
        member: parentClass,
        memberPart: PROTOTYPE_TOKEN
      });

      if (!call) return superObject;

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
      var name = identifierReference.token;

      // Handle static variables. We need to any parent contexts too, in case a nested
      // class is using a static variable of a parent class.
      while (scope && scope.classContext) {
        if (scope.classContext.isInContext(name.value)) {
          var declaration = scope.classContext.lookup(name.value);

          if (declaration.is('static_method', 'static_var_declaration')) {
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
        var value = instanceVarDeclaration.value || new TokenNode(Token.UNDEFINED);

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
          var memberAssign = $statement($assignment(
            $node('member_identifier', [nameToken], ['name']),
            value
          ));

          constructorMethod.children('.body').prepend(memberAssign);
        }
      });

      return null;
    },

    onAutoSetParam: function(autoSetParam, scope) {
      var body = autoSetParam.closest('method').children('.body');
      var nameToken = autoSetParam.children('variable_declaration').children('.name');
      var value = autoSetParam.children('variable_declaration').children('.value');
      var name = nameToken.text();

      if (!scope.classContext.instanceVariables[name]) {
        throw new error.NoMemberToSet(nameToken.attr('line'), name);
      }

      value = value.size() ? $node('simple_expression', [
        nameToken,
        Token.LOGICAL_OR,
        value
      ], [
        'left',
        'operator',
        'right'
      ]) : nameToken;

      var setStatement = $statement($assignment(makeThisReference(nameToken), value));
      body.prepend(setStatement);

      // Needs to be a variable declaration to be consistent
      return $node('variable_declaration', [
        nameToken
      ], [
        'name'
      ]);
    },

    onAccessor: function(accessor, scope) {
      var classBody = accessor.parent();
      var type = accessor.children('.type').text();
      var variables = accessor.children('.variables').children();
      var typeMap = {
        'gets': makeGetter,
        'sets': makeSetter,
        'accesses': makeAccessor
      };

      function makeNameToken(prefix, name) {
        return $token(Token.identify(prefix + name.charAt(0).toUpperCase() + name.substring(1)).token);
      }

      function methodAlreadyExists(methodName) {
        return scope.classContext.isInContext(methodName);
      }

      function makeGetter(variable) {
        var nameToken = variable.children('.name');
        var name = nameToken.text();
        var getterName = makeNameToken('get', name);

        if (methodAlreadyExists(getterName.text())) return;

        var getter = $node('method', [
          getterName,
          $node('parameter_list'),
          $node('function_body', [
            $statement(
              $node('keyword_statement', [
                $token(Token.RETURN),
                $node('member_identifier', [nameToken], ['name'])
              ], [
                'keyword',
                'expression'
              ])
            )
          ])
        ], [
          'name',
          'parameters',
          'body'
        ]);

        var memberIdentifier = getter.find('member_identifier');
        this.handleMatch(memberIdentifier, this.onMemberIdentifier, scope);

        return getter;
      }

      function makeSetter(variable) {
        var nameToken = variable.children('.name');
        var name = nameToken.text();
        var setterName = makeNameToken('set', name);

        if (methodAlreadyExists(setterName.text())) return;

        var setter = $node('method', [
            setterName,
            $node('parameter_list', [
              $node('auto_set_param', [
                $node('variable_declaration', [nameToken], ['name', 'value'])
              ])
            ]),
            $node('function_body', [])
          ], [
            'name',
            'parameters',
            'body'
          ]);

        var autoSetParam = setter.find('auto_set_param');

        // We can just let the auto-setting param logic do this for us.
        this.handleMatch(autoSetParam, this.onAutoSetParam, scope);

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
      variables.each(function() {
        var variable = $(this);

        var nameToken = variable.children('.name');
        var name = nameToken.text();

        var methods = typeMap[type].call(_this, variable);
        classBody.append.apply(classBody, methods);
      });

      return null;
    }
  });
}(jQuery);
