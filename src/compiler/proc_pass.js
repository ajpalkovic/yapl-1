!function($) {
  // We do procs in their own pass so we don't have to worry about other yapl-specific
  // syntax elements (such as one_line_if)
  var ProcTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function ProcTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'proc_body': this.onProcBody,
        'proc': this.onProc
      });
    },

    onProcBody: function(procBody, scope) {
      function findLastBranchingElement(body) {
        var lastChild = body.children().last();

        if (lastChild.is('if_statement')) {
          var lastBranchingElement = findLastBranchingElement(lastChild.children('.body'));
          return lastBranchingElement ? lastBranchingElement : lastChild;
        }
      }

      var lastBranchingElement = findLastBranchingElement(procBody);
      var lastExpressionStatement = lastBranchingElement ?
        lastBranchingElement.children('.body').children().last() : procBody.children().last();

      function _onLastExpressionStatement(lastExpressionStatement, scope) {
        return $statement($node('keyword_statement', [
          $token(Token.RETURN),
          lastExpressionStatement.children('.statement')
        ], [
          'keyword',
          'expression'
        ]));
      }

      this.handleMatch(lastExpressionStatement, _onLastExpressionStatement, scope);
    },

    onProc: function(proc, scope, compiler) {
      var body = proc.children('.body');
      this.traverseChildren(body, scope, compiler);

      var procLastStatement = body.children('proc_last_statement');

      procLastStatement.replaceWith($statement(procLastStatement.children('.statement')));

      return $node('function_expression', [
        proc.children('.parameters'),
        $node('function_body', [body.children()])
      ], [
        'parameters',
        'body'
      ]);
    }
  });
}(jQuery);