!function($) {
  var CleanupTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function CleanupTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'extern_var_statement': this.onExternVarStatement
      });
    },

    onExternVarStatement: function(externVarStatement, scope) {
      return null;
    }
  });
}(jQuery);