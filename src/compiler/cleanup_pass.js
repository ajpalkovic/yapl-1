!function($) {
  var CleanupTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function CleanupTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'extern_variable_statement': this.onExternVariableStatement
      });
    },

    onExternVariableStatement: function(externVariableStatement, scope) {
      return null;
    }
  });
}(jQuery);
