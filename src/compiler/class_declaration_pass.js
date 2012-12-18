!function($) {
  var PROTOTYPE_TOKEN = new TokenNode('prototype');
  var SURROGATE_CTOR_TOKEN = new TokenNode('__surrogate_ctor');
  var CONSTRUCTOR_TOKEN = new TokenNode('constructor');

  function classPrototype(className) {
    return new Node('property_access', {
      member: className,
      memberPart: PROTOTYPE_TOKEN
    });
  }

  function methodToFunction(method, anonymous) {
    return new Node('function_declaration', {
      name: anonymous ? null : method.name,
      parameters: method.parameters,
      body: method.body
    });
  }

  function createFunctionOnPrototype(method, className) {
    var propertyAccess = new Node('property_access', {
      member: classPrototype(className),
      memberPart: method.name
    });

    return Node.statement(Node.assignment(propertyAccess, methodToFunction(method, true)));
  }

  function createStaticFunction(method, className) {
    var propertyAccess = new Node('property_access', {
      member: className,
      memberPart: method.name
    });

    return Node.statement(Node.assignment(propertyAccess, methodToFunction(method, true)));
  }

  function createStaticVariable(variable, className) {
    var propertyAccess = new Node('property_access', {
      member: className,
      memberPart: variable.name
    });

    var value = variable.value.notNull() ? variable.value : new TokenNode('undefined');

    return Node.statement(Node.assignment(propertyAccess, value));
  }

  var ClassDeclarationTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function ClassDeclarationTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'class_declaration': this.onClassDeclaration
      });
    },

    onClassDeclaration: function(classDeclaration, scope, compiler) {

      var parentClass = classDeclaration.parentClass;
      var classBody = classDeclaration.body;
      var wrapper = new Node('function_expression', {
        name: null,
        parameters: new NodeList('parameter_list'),
        body: new NodeList('function_body')
      });

      var wrapperBody = wrapper.body;
      var classNameToken = classDeclaration.name;

      // Make the constructor function, but rename it to the class name
      // so the created objects will have the right name.
      var constructorMethod = classBody.constructor.remove();
      constructorMethod = new Node('method', {
        name: classNameToken,
        parameters: constructorMethod.parameters,
        body: constructorMethod.body
      });

      var constructorFn = methodToFunction(constructorMethod);

      wrapperBody.append(constructorFn);

      // If we have a parent class, we need to set up the prototype.
      if (parentClass.notNull()) {
        var surrogateCtor = new Node('function_declaration', {
          name: SURROGATE_CTOR_TOKEN,
          parameters: new NodeList('parameter_list'),
          body: new NodeList('function_body')
        });

        wrapperBody.append(surrogateCtor);

        var surrogatePrototype = new Node('property_access', {
          member: SURROGATE_CTOR_TOKEN,
          memberPart: PROTOTYPE_TOKEN
        });

        var prototypeAssignment = Node.statement(Node.assignment(surrogatePrototype, classPrototype(parentClass)));
        wrapperBody.append(prototypeAssignment);

        var newSurrogate = new Node('new_expression', [SURROGATE_CTOR_TOKEN]);

        var inheritanceAssignment = Node.statement(Node.assignment(classPrototype(classNameToken), newSurrogate));
        wrapperBody.append(inheritanceAssignment);
      }

      // Handle the static variables
      classBody.children('static_var_declaration_statement').each(function(staticVarDeclarationStatement) {
        staticVarDeclarationStatement.remove();
        var staticVariables = staticVarDeclarationStatement.variableDeclarationList;

        staticVariables.each(function(staticVarDeclaration) {
          wrapperBody.append(createStaticVariable(staticVarDeclaration, classNameToken));
        });
      });

      // Handle the static methods
      classBody.children('static_method').each(function(staticMethod) {
        staticMethod.remove();

        wrapperBody.append(createStaticFunction(staticMethod, classNameToken));
      });

      // Handle the methods
      classBody.children('method').each(function(method) {
        wrapperBody.append(createFunctionOnPrototype(method, classNameToken));
      });

      // Set up the constructor property on the prototype.
      var constructorAssignment = Node.statement(Node.assignment(
        new Node('property_access', {
          member: classPrototype(classNameToken),
          memberPart: CONSTRUCTOR_TOKEN
        }),

        classNameToken
      ));

      wrapperBody.append(constructorAssignment);

      // We prepend everything else to the top of the wrapper. This is all the code that will be
      // executed when the class is created, not instances of that class.
      var classBodyCode = classBody.children();
      wrapperBody.prepend.apply(wrapperBody, classBodyCode);

      var returnStatement = Node.statement(new Node('keyword_statement', {
        keyword: new TokenNode(Token.RETURN),
        expression: constructorFn.name
      }));

      wrapperBody.append(returnStatement);

      // We can't use the closure node here because they are handled in an
      // earlier stage in compilation.
      var call = new Node('call', {
        member: new Node('nested_expression', [wrapper]),
        memberPart: new NodeList('parameter_list')
      });

      function makeNamespace(scope) {
        if (!(scope && scope.classContext)) return;

        var namespace = makeNamespace(scope.parentScope);

        if (!namespace) return scope.classContext.declaration.name;

        return new Node('property_access', {
          member: namespace,
          memberPart: scope.classContext.declaration.name
        });
      }

      // Only statically nested classes get namespaced, not classes created in methods.
      var namespacedClass = scope.context ? classNameToken : makeNamespace(scope)
      return Node.variable(classNameToken, Node.assignment(namespacedClass, call));
    }
  });
}(jQuery);
