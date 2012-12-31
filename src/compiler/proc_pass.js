function wrapStatementsForReturn(body) {
  if (!body) return;

  body.each(function(child) {
    switch (child.type) {
      case 'if_statement':
        wrapStatementsForReturn(child.body);
        wrapStatementsForReturn(child.elseIfList);
        wrapStatementsForReturn(child.elsePart);
        break;

      case 'with_statement':
        wrapStatementsForReturn(child.body);
        break;

      case 'switch_statement':
        child.caseBlock.cases.each(function(caseNode) {
          wrapStatementsForReturn(caseNode);
        });

        wrapStatementsForReturn(child.caseBlock['default']);
        break;

      case 'try_statement':
        wrapStatementsForReturn(child.body);
        wrapStatementsForReturn(child['catch']);
        wrapStatementsForReturn(child['finally']);
        break;

      case 'terminated_statement':
        var statement = child.statement;
        if (statement.is('expression')) {
          statement.replaceWith(Node.assignment(
            new TokenNode('__ret'),
            statement
          ));
        }
    }
  });
}

!function() {
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
      if (!procBody.size()) return;

      wrapStatementsForReturn(procBody);
      procBody.prepend(Node.variable(
        new TokenNode('__ret'),
        new TokenNode('undefined')
      ));

      procBody.append(Node.statement(new Node('keyword_statement', {
        keyword: new TokenNode(Token.RETURN),
        expression: new Node('identifier_reference', {
          name: new TokenNode('__ret')
        })
      })));
    },

    onProc: function(proc, scope, compiler) {
      var body = proc.body;
      var procLastStatement = body.children('proc_last_statement')[0];
      if (procLastStatement) procLastStatement.replaceWith(Node.statement(procLastStatement.statement));

      this.handleMatch(body, this.onProcBody, scope, compiler);

      return new Node('function_expression', {
        name: null,
        parameters: proc.parameters,
        body: new NodeList('function_body', body.children())
      });
    }
  });
}();