!function() {
  var CleanupTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function CleanupTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'extern_variable_statement': this.onExternVariableStatement
      });
    },

    onExternVariableStatement: function(externVariableStatement, scope) {
      // We want to delete the entire statement from the source, else we just have
      // a line with a dangling semi-colon.
      externVariableStatement.parent.replaceWith(null);
    }
  });
}();
