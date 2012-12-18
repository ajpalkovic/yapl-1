!function() {
  /**
   * Creates a new parse action for a list node.
   */
  function list(type) {
    type = toTagName(type);

    return overload(function() {
      return new NodeList(type);
    }, function(firstElement) {
      var node = new NodeList(type);
      node.prepend(firstElement);

      return node;
    }, function(element, nodeList) {
      nodeList.prepend(element);
      return nodeList;
    }, function(element, delimiter, nodeList) {
      nodeList.prepend(element);
      return nodeList;
    });
  }

  /**
   * Default parse action to create a node with the parameters of the parse
   * action passed in as the parameters to the constructor.
   */
  function node(type, childNames) {
    type = toTagName(type);

    return function() {
      var args = $A(arguments);
      var children = childNames ? childNames.mapTo(args) : args;
      return new Node(type, children);
    };
  }

  function flatteningNode(type, childNames) {
    return function() {
      if (arguments.length === 1) return arguments[0];

      return node(type, childNames).apply(this, arguments);
    }
  }

  var ParseActions = {
    Program: list('Program'),
    ClassDeclaration: node('ClassDeclaration', ['name', 'parentClass', 'body']),
    ClassBody: list('ClassBody'),
    Method: node('Method', ['name', 'parameters', 'body']),

    StaticMethod: function(method) {
      return new Node('static_method', {
        name: method.name,
        parameters: method.parameters,
        body: method.body
      });
    },

    InstanceVarDeclarationStatement: node('InstanceVarDeclarationStatement'),
    InstanceVarDeclarationList: list('InstanceVarDeclarationList'),
    InstanceVarDeclaration: node('InstanceVarDeclaration', ['name', 'value']),

    StaticVarDeclarationStatement: function(variableStatement) {
      var variableDeclarationList = variableStatement.variableDeclarationList;

      variableDeclarationList.each(function(variableDeclaration) {
        variableDeclaration.setType('static_var_declaration');
      });

      return new Node('static_var_declaration_statement', [
        variableDeclarationList
      ]);
    },

    Accessor: node('Accessor', ['type', 'variables']),
    AccessorVariable: node('AccessorVariable', ['name']),
    AccessorList: list('AcessorList'),
    FunctionDeclaration: node('FunctionDeclaration', ['name', 'parameters', 'body']),
    Closure: node('Closure', ['parameters', 'body']),
    ClosureParameter: node('ClosureParameter', ['name', 'value']),

    FunctionExpression: overload(function(parameters, body) {
      return new Node('function_expression', {
        name: null,
        parameters: parameters,
        body: body
      });
    }, function(name, parameters, body) {
      return new Node('function_expression', {
        name: name,
        parameters: parameters,
        body: body
      });
    }),

    Proc: node('Proc', ['parameters', 'body']),

    ProcBody: overload(function() {
      return new NodeList('proc_body');
    }, function(body) {
      return body;
    }),

    ProcBodyLastElementOptTerminator: list('ProcBody'),
    ProcLastStatement: node('ProcLastStatement', ['statement']),
    EmptyList: list('EmptyList'),
    ParameterList: list('ParameterList'),
    AutoSetParam: node('AutoSetParam'),
    FunctionBody: list('FunctionBody'),
    MemberIdentifier: node('MemberIdentifier', ['name']),
    ArrayLiteral: node('ArrayLiteral', ['elements']),
    ArrayElementList: list('ArrayElementList'),
    ObjectLiteral: node('ObjectLiteral'),
    PropertyList: list('PropertyList'),
    Property: node('Property', ['name', 'value']),

    Expression: function(expression) {
      expression.tagAs('expression');

      return expression;
    },

    AssignmentExpression: node('AssignmentExpression', ['left', 'operator', 'right']),
    ParallelAssignmentExpression: node('ParallelAssignmentExpression', ['left', 'operator', 'right']),
    MemberExpressionList: list('MemberExpressionList'),
    ExpressionList: list('ExpressionList'),
    ConditionalExpression: node('ConditionalExpression', ['condition', 'truePart', 'falsePart']),
    SimpleExpression: flatteningNode('SimpleExpression', ['left', 'operator', 'right']),
    AdditiveExpression: flatteningNode('AdditiveExpression', ['left', 'operator', 'right']),
    Term: flatteningNode('Term', ['left', 'operator', 'right']),
    ExponentiationExpression: flatteningNode('ExponentiationExpression', ['left', 'right']),
    UnaryExpression: flatteningNode('UnaryExpression', ['operator', 'expression']),
    PostfixIncrementExpression: node('PostfixIncrementExpression', ['expression', 'operator']),
    PrefixIncrementExpression: node('PrefixIncrementExpression', ['operator', 'expression']),
    NewExpression: node('NewExpression'),

    MemberExpression: overload(function(primaryExpression) {
      return primaryExpression
    }, function(primaryExpression, memberChain) {
      memberChain.prepend(primaryExpression);

      // Make the hierarchy from the flattened chain.
      var tree = memberChain.children()[0].remove();

      while (memberChain.children().length) {
        var memberPart = memberChain.children()[0].remove();

        var type = memberPart.type;

        tree = new Node(type, {
          member: tree,
          memberPart: memberPart.children()[0]
        });
      }

      return tree;
    }),

    MemberChain: list('MemberChain'),
    PropertyAccess: node('PropertyAccess', ['property']),
    BindExpression: node('BindExpression', ['call']),
    ArrayDereference: node('ArrayDereference', ['index']),
    ConditionalLoad: node('ConditionalLoad', ['property']),
    Call: node('Call'),
    ArgumentList: list('ArgumentList'),
    This: node('This'),
    Super: node('Super'),
    Symbol: node('Symbol'),
    RegexLiteral: node('RegexLiteral'),
    DoubleStringLiteral: node('DoubleStringLiteral'),
    SingleStringLiteral: node('SingleStringLiteral'),
    NativeCodeStringLiteral: node('NativeCodeStringLiteral', ['code']),
    IdentifierReference: node('IdentifierReference', ['name']),
    PrimitiveLiteralExpression: node('PrimitiveLiteralExpression', ['value']),
    NestedExpression: node('NestedExpression'),
    Operator: node('Operator'),
    TerminatedStatement: node('TerminatedStatement', ['statement']),
    StatementList: list('StatementList'),
    VariableStatement: node('VariableStatement'),
    ExternVariableStatement: node('ExternVariableStatement'),
    VariableDeclarationList: list('VariableDeclarationList'),
    VariableDeclaration: node('VariableDeclaration', ['name', 'value']),

    IfStatement: overload(function(condition, body) {
      return ParseActions['IfStatement'](condition, body, null, null);
    }, function(condition, body, rest) {
      var ifStatement = new Node('if_statement', {
        condition: condition,
        body: body
      });

      ifStatement.append(rest);
      ifStatement.append(null, rest.is('else_if_list') ? 'else_part' : 'else_if_list');

      return ifStatement;
    }, function(condition, body, elseIfList, elsePart) {
      return new Node('if_statement', {
        condition: condition,
        body: body,
        elseIfList: elseIfList,
        elsePart: elsePart
      });
    }),

    OneLineIfStatement: node('OneLineIfStatement', ['body', 'condition']),
    UnlessStatement: node('UnlessStatement', ['condition', 'body']),
    OneLineUnlessStatement: node('OneLineUnlessStatement', ['body', 'condition']),
    OneLineWhileStatement: node('OneLineWhileStatement', ['body', 'condition']),
    OneLineUntilStatement: node('OneLineUntilStatement', ['body', 'condition']),
    ElsePart: node('ElsePart', ['body']),
    ElseIfList: list('ElseIfList'),
    ElseIf: node('ElseIf', ['condition', 'body']),
    WhileLoop: node('WhileLoop', ['condition', 'body']),
    UntilLoop: node('UntilLoop', ['condition', 'body']),
    DoWhileLoop: node('DoWhileLoop', ['body', 'condition']),
    DoUntilLoop: node('DoUntilLoop', ['body', 'condition']),
    ForLoop: node('ForLoop', ['structure', 'body']),
    StandardForStructure: node('StandardForStructure'),
    ForEachStructure: node('ForEachStructure', ['value', 'collection', 'index']),
    MultipleForEachStructure: node('MultipleForEachStructure', ['key', 'value', 'collection', 'index']),
    InflectedForStructure: node('InflectedForStructure', ['collection', 'index']),
    ContinueStatement: node('KeywordStatement', ['keyword']),
    BreakStatement: node('KeywordStatement', ['keyword']),
    ReturnStatement: node('KeywordStatement', ['keyword', 'expression']),
    WithStatement: node('WithStatement', ['scope', 'body']),
    SwitchStatement: node('SwitchStatement', ['condition', 'caseBlock']),
    CaseBlock: node('CaseBlock', ['cases', 'default']),
    Case: node('Case', ['expressions', 'body']),
    CaseList: list('CaseList'),
    DefaultCase: node('DefaultCase', ['body']),
    LabeledStatement: node('LabeledStatement'),
    ThrowStatement: node('KeywordStatement', ['keyword', 'expression']),
    TryStatement: node('TryStatement', ['body', 'catch', 'finally']),
    Catch: node('Catch', ['exception', 'body']),
    ExceptionVarDeclaration: node('ExceptionVarDeclaration', ['name']),
    Finally: node('Finally', ['body']),
    DebuggerStatement: node('KeywordStatement', ['keyword']),
  };

  window.ParseActions = ParseActions;
}();
