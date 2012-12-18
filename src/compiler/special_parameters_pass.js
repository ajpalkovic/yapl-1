!function($) {
  var SpecialParametersTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function SpecialParametersTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'parameter_list': this.onParameters
      });
    },

    onParameters: function(parameters, scope) {
      var callable = parameters.parent;
      var callableName = callable.name;
      var body = callable.body;

      var paramPrologue = [];

      function handleDefaultArgument(paramName, paramValue, nextParam) {
        // The idea here is that if the current parameter has a default argument
        // the next parameter needs one too. It prevents this from happening:
        //
        // function foo(a=1, b, c=3); end
        // foo 4, 5
        //
        // In that code, it is unclear whether 'a' should get 4, or 'c' should get '5'.
        // 'b' has to have at least one or the other.
        if (nextParam.notNull()) {
          if (nextParam.value.isNull()) {
            throw new error.InvalidDefaultArgumentConfiguration(callableName.line, callableName.value);
          }
        }

        var assignment = Node.statement(
          Node.assignment(
            paramName,
            new Node('simple_expression', {
              left: paramName,
              operator: Node.operator(Token.LOGICAL_OR),
              right: paramValue
            })
          )
        );

        paramPrologue.push(assignment);
      }

      parameters.each(function(parameter, i) {
        var nextParam = parameters.get(i + 1) || new NullNode();
        var paramName = parameter.name;
        var paramValue = parameter.value;

        if (paramValue.notNull()) handleDefaultArgument(paramName, paramValue, nextParam);

        parameter.replaceWith(paramName);
      });

      body.prepend.apply(body, paramPrologue);
    }
  });
}(jQuery);