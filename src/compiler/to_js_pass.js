!function() {
  function makeListHandler(delimiter) {

    if (delimiter) {
      var newlineIndex = delimiter.indexOf('\n');
      if (newlineIndex >= 0) {
        var before = delimiter.substring(0, newlineIndex);
        var after = delimiter.substring(newlineIndex + 1);

        delimiter = [before, '\n', after];
      }
    }

    return function(list, emitter) {
      var size = list.size();

      list.each(function(child, i) {
        emitter.e(child);
        if (i < size - 1 && delimiter !== undefined) emitter.e(delimiter);
      });
    };
  }

  var ToJsEmitter = klass(pass, pass.EmitterPass, {
    initialize: function ToJsEmitter() {
      pass.EmitterPass.prototype.initialize.call(this, {
        'program': this.onNewlineList,
        'function_declaration': this.onFunctionDeclaration,
        'function_expression': this.onFunctionExpression,
        'empty_list': this.onList,
        'parameter_list': this.onCommaList,
        'function_body': this.onNewlineList,
        'array_literal': this.onArrayLiteral,
        'array_element_list': this.onCommaList,
        'object_literal': this.onObjectLiteral,
        'property_list': this.onCommaNewlineList,
        'property': this.onProperty,
        'parallel_assignment_list': this.onCommaList,
        'assignment_expression': this.onExpression,
        'expression_list': this.onCommaList,
        'conditional_expression': this.onConditionalExpression,
        'simple_expression': this.onExpression,
        'additive_expression': this.onExpression,
        'term': this.onExpression,
        'exponentiation_expression': this.onExpression,
        'unary_expression': this.onUnaryExpression,
        'postfix_increment_expression': this.onPostfixIncrementExpression,
        'prefix_increment_expression': this.onUnaryExpression,
        'new_expression': this.onNewExpression,
        'member_expression': this.onMemberExpression,
        'property_access': this.onPropertyAccess,
        'bind_expression': this.onBindExpression,
        'array_dereference': this.onArrayDereference,
        'call': this.onCall,
        'argument_list': this.onCommaList,
        'this': this.onThis,
        'regex_literal': this.onRegexLiteral,
        'single_string_literal': this.onStringLiteral,
        'double_string_literal': this.onStringLiteral,
        'native_code_string_literal': this.onNativeCodeStringLiteral,
        'identifier_reference': this.onIdentifierReference,
        'primitive_literal_expression': this.onPrimitiveLiteralExpression,
        'nested_expression': this.onNestedExpression,
        'operator': this.onOperator,
        'terminated_statement': this.onTerminatedStatement,
        'statement_list': this.onNewlineList,
        'end_st': this.onEndSt,
        'variable_statement': this.onVariableStatement,
        'variable_declaration_list': this.onCommaList,
        'variable_declaration': this.onVariableDeclaration,
        'if_statement': this.onIfStatement,
        'else_part': this.onElsePart,
        'else_if_list': this.onList,
        'else_if': this.onElseIf,
        'while_loop': this.onWhileLoop,
        'do_while_loop': this.onDoWhileLoop,
        'for_loop': this.onForLoop,
        'standard_for_structure': this.onStandardForStructure,
        'for_in_structure': this.onForInStructure,
        'with_statement': this.onWithStatement,
        'switch_statement': this.onSwitchStatement,
        'case_block': this.onCaseBlock,
        'case_list': this.onNewlineList,
        'case': this.onCase,
        'default_case': this.onDefaultCase,
        'try_statement': this.onTryStatement,
        'catch': this.onCatch,
        'exception_var_declaration': this.onExceptionVarDeclaration,
        'finally': this.onFinally,
        'keyword_statement': this.onKeywordStatement,
      });
    },

    onList: makeListHandler(),

    onNewlineList: makeListHandler('\n'),

    onCommaList: makeListHandler(', '),

    onCommaNewlineList: makeListHandler(',\n'),

    onFunctionDeclaration: function(functionDeclaration, emitter) {
      var name = functionDeclaration.name;
      var parameters = functionDeclaration.parameters;
      var body = functionDeclaration.body;

      emitter.e('function ', name, '(', parameters, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onFunctionExpression: function(functionExpression, emitter) {
      var name = functionExpression.name;
      var parameters = functionExpression.parameters;
      var body = functionExpression.body;

      emitter.e('function ', name, '(', parameters, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onArrayLiteral: function(arrayLiteral, emitter) {
      var arrayElements = arrayLiteral.elements;

      emitter.e('[', arrayElements, ']');
    },

    onObjectLiteral: function(objectLiteral, emitter) {
      var propertyList = objectLiteral.propertyList;

      emitter.e('{').blk()
        .e(propertyList)
      .end().e('}');
    },

    onProperty: function(property, emitter) {
      var name = property.name;
      var value = property.value;

      emitter.e(name, ': ', value);
    },

    onExpression: function(assignmentExpression, emitter) {
      var left = assignmentExpression.left;
      var operator = assignmentExpression.operator;
      var right = assignmentExpression.right;

      emitter.e(left, ' ', operator, ' ', right);
    },

    onConditionalExpression: function(conditionalExpression, emitter) {
      var condition = conditionalExpression.condition;
      var truePart = conditionalExpression.truePart;
      var falsePart = conditionalExpression.falsePart;

      emitter.e(condition, ' ? ', truePart, ' : ', falsePart);
    },

    onUnaryExpression: function(unaryExpression, emitter) {
      var operator = unaryExpression.operator;
      var expression = unaryExpression.expression;

      emitter.e(operator, expression);
    },

    onPostfixIncrementExpression: function(postfixIncrementExpression, emitter) {
      var expression = postfixIncrementExpression.expression;
      var operator = postfixIncrementExpression.operator;

      emitter.e(expression, operator);
    },

    onNewExpression: function(newExpression, emitter) {
      var expression = newExpression.children();

      emitter.e('new ', expression);
    },

    onPropertyAccess: function(propertyAccess, emitter) {
      var member = propertyAccess.member;
      var memberPart = propertyAccess.memberPart;

      emitter.e(member, '.', memberPart);
    },

    onArrayDereference: function(arrayDereference, emitter) {
      var member = arrayDereference.member;
      var memberPart = arrayDereference.memberPart;

      emitter.e(member, '[', memberPart, ']');
    },

    onCall: function(call, emitter) {
      var member = call.member;
      var memberPart = call.memberPart;

      emitter.e(member, '(', memberPart, ')');
    },

    onThis: function(thisElement, emitter) {
      emitter.e(thisElement.children());
    },

    onRegexLiteral: function(regexLiteral, emitter) {
      emitter.e(regexLiteral.children());
    },

    onStringLiteral: function(stringLiteral, emitter) {
      emitter.e(stringLiteral.children());
    },

    onNativeCodeStringLiteral: function(nativeCodeStringLiteral, emitter) {
      var code = nativeCodeStringLiteral.code.value;

      if (code.length) {
        // Removes the ticks
        code = code.substring(1, code.length - 1);
        var lines = code.split('\n');
        var toEmit = []

        lines.each(function(line, i) {
          toEmit.push(line);

          if (i < lines.length - 1) toEmit.push('\n');
        });

        emitter.e(toEmit);
      }
    },

    onIdentifierReference: function(identifierReference, emitter) {
      emitter.e(identifierReference.name);
    },

    onPrimitiveLiteralExpression: function(primitiveLiteralExpression, emitter) {
      var value = primitiveLiteralExpression.value;

      emitter.e(value);
    },

    onNestedExpression: function(nestedExpression, emitter) {
      emitter.e('(', nestedExpression.children(), ')');
    },

    onOperator: function(operator, emitter) {
      emitter.e(operator.token);
    },

    onTerminatedStatement: function(terminatedStatement, emitter) {
      var statement = terminatedStatement.statement;

      if (statement.notNull) emitter.e(statement, ';');
    },

    onVariableStatement: function(variableStatement, emitter) {
      var declarations = variableStatement.variableDeclarationList;

      emitter.e('var ', declarations);
    },

    onVariableDeclaration: function(variableDeclaration, emitter) {
      var name = variableDeclaration.name;
      var value = variableDeclaration.value;

      if (value.notNull()) {
        emitter.e(Node.assignment(name, value));
      } else {
        emitter.e(name);
      }
    },

    onIfStatement: function(ifStatement, emitter) {
      var condition = ifStatement.condition;
      var body = ifStatement.body;
      var elseIfs = ifStatement.elseIfList;
      var elsePart = ifStatement.elsePart;

      emitter.e('if (', condition, ') {').blk()
        .e(body)
      .end().e('}')
      .e(elseIfs)
      .e(elsePart)
    },

    onElsePart: function(elsePart, emitter) {
      var body = elsePart.body;

      emitter.e(' else {').blk()
        .e(body)
      .end().e('}');
    },

    onElseIf: function(elseIf, emitter) {
      var condition = elseIf.condition;
      var body = elseIf.body;

      emitter.e(' else ', new Node('if_statement', {
        condition: condition,
        body: body
      }));
    },

    onWhileLoop: function(whileLoop, emitter) {
      var condition = whileLoop.condition;
      var body = whileLoop.body;

      emitter.e('while (', condition, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onDoWhileLoop: function(doWhileLoop, emitter) {
      var body = doWhileLoop.body;
      var condition = doWhileLoop.condition;

      emitter.e('do {').blk()
        .e(body)
      .end().e('} while (', condition, ');');
    },

    onForLoop: function(forLoop, emitter) {
      var structure = forLoop.structure;
      var body = forLoop.body;

      emitter.e('for (', structure, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onForInStructure: function(forInStructure, emitter) {
      var key = forInStructure.key;
      var collection = forInStructure.collection;

      emitter.e(key, ' in ', collection);
    },

    onStandardForStructure: function(standardForStructure, emitter) {
      var variable = standardForStructure.variable;
      var condition = standardForStructure.condition;
      var increment = standardForStructure.increment;

      emitter.e(variable, ' ', condition, ' ', increment);
    },

    onWithStatement: function(withStatement, emitter) {
      var scope = withStatement.scope;
      var body = withStatement.body;

      emitter.e('with (', scope, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onSwitchStatement: function(switchStatement, emitter) {
      var condition = switchStatement.condition;
      var cases = switchStatement.cases;

      emitter.e('switch (', condition, ') {').blk()
        .e(cases)
      .end().e('}');
    },

    onCaseBlock: function(caseBlock, emitter) {
      var cases = caseBlock.cases;
      var defaultCase = caseBlock.default;

      emitter.e(cases, defaultCase);
    },

    onCase: function(caseElement, emitter) {
      var expression = caseElement.expressions;
      var body = caseElement.body;

      if (body.children().size()) {
        emitter.e('case ', expression, ':').blk()
          .e(body)
        .end();
      } else {
        emitter.e('case ', expression, ':');
      }
    },

    onDefaultCase: function(defaultCase, emitter) {
      var body = defaultCase.body;

      emitter.e('default:').blk()
        .e(body)
      .end();
    },

    onTryStatement: function(tryStatement, emitter) {
      var body = tryStatement.body;
      var catchElement = tryStatement.catch;
      var finallyElement = tryStatement.finally;

      emitter.e('try {').blk()
        .e(body)
      .end().e('}')
      .e(catchElement)
      .e(finallyElement)
    },

    onCatch: function(catchElement, emitter) {
      var exception = catchElement.exception;
      var body = catchElement.body;

      emitter.e(' catch (', exception, ') {').blk()
        .e(body)
      .end().e('}');
    },

    onExceptionVarDeclaration: function(exceptionVarDeclaration, emitter) {
      emitter.e(exceptionVarDeclaration.name);
    },

    onFinally: function(finallyElement, emitter) {
      var body = finallyElement.body;

      emitter.e(' finally {').blk()
        .e(body)
      .end().e('}');
    },

    onKeywordStatement: function(keywordStatement, emitter) {
      var keyword = keywordStatement.keyword;
      var expression = keywordStatement.expression;

      if (expression.notNull()) {
        emitter.e(keyword, ' ', expression);
      } else {
        emitter.e(keyword);
      }
    }
  });
}();
