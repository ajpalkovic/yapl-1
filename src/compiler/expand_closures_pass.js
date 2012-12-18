!function($) {
  var ExpandClosuresTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function ExpandClosuresTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'closure': this.onClosure
      });
    },

    onClosure: function(closure, scope, compiler) {
      var parameters = closure.parameters;
      var body = closure.body;

      var callArguments = new NodeList('argument_list');
      var newParameters = new NodeList('parameter_list');

      parameters.each(function(parameter) {
        var name = parameter.name;
        var value = parameter.value;

        var referencedName = value.notNull() ? value.name : name.name;

        // The closure construct does not allow parameter names that don't already shadow
        // the same symbol in some parent scope.
        if (!scope.hasSymbol(referencedName.value)) {
          throw new error.ReferenceError(referencedName.line, referencedName.value);
        }

        var newParameter = new Node('variable_declaration', {
          name: name,
          value: null
        });

        newParameters.append(newParameter);
        callArguments.append(referencedName);
      });

      var nestedExpression = new Node('nested_expression', [
        new Node('function_expression', {
          name: null,
          parameters: newParameters,
          body: body
        })
      ]);

      return new Node('call', {
        member: nestedExpression,
        memberPart: callArguments
      });
    }
  });
}(jQuery);