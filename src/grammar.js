// To avoid disgusting left-factoring of many of these rules, the longer
// rules that are ambiguous are before those that are smaller, so it solves
// the problem.  This means ORDER OF THE PRODUCTIONS MATTERS!
var Grammar = {
  Program: {
    productions: [
      ['SourceElement', 'Program'],
      ['<<EOF>>']
    ]
  },

  SourceElement: {
    productions: [
      ['Statement'],
      ['ClassDeclaration'],
      ['Closure']
    ]
  },

  // Used for the body of string interpolations (allows us to have blank interpolations)
  InterpolationBody: {
    productions: [
      ['SourceElement'],
      ['<<EOF>>']
    ]
  },

  ClassDeclaration: {
    productions: [
      ['CLASS', '(IDENTIFIER)', 'OptParentClass', '(?EmptyStatement)', 'ClassBody', 'END']
    ]
  },

  OptParentClass: {
    productions: [
      ['EXTENDS', 'ParentClass'],
      []
    ]
  },

  ParentClass: {
    productions: [
      ['IdentifierReference', 'DOT', 'ParentClass'],
      ['IdentifierReference']
    ]
  },

  ClassBody: {
    productions: [
      ['ClassElement', 'ClassBody'],
      []
    ]
  },

  ClassElement: {
    productions: [
      ['Accessor', 'EndSt'],
      ['Statement'],
      ['Method'],
      ['StaticMethod'],
      ['InstanceVarDeclarationStatement'],
      ['StaticVarDeclarationStatement'],
      ['ClassDeclaration']
    ]
  },

  Method: {
    productions: [
      ['DEF', '(IDENTIFIER)', 'Parameters', 'FunctionBody', 'END']
    ],

    redefinitions: {
      Parameter: [
        ['AutoSetParam'],
        ['VariableDeclaration']
      ],

      PrimaryExpression: [
        ['This'],
        ['Super'],
        ['RegexLiteral'],
        ['StringLiteral'],
        ['Symbol'],
        ['IdentifierReference'],
        ['PrimitiveLiteralExpression'],
        ['MemberIdentifier'],
        ['ObjectLiteral'],
        ['ArrayLiteral'],
        ['NestedExpression']
      ]
    }
  },

  StaticMethod: {
    productions: [
      ['STATIC', 'Method']
    ]
  },

  InstanceVarDeclarationStatement: {
    productions: [
      ['INS_VAR', 'InstanceVarDeclarationList', 'EndSt']
    ]
  },

  InstanceVarDeclarationList: {
    productions: [
      ['InstanceVarDeclaration', 'COMMA', 'InstanceVarDeclarationList'],
      ['InstanceVarDeclaration']
    ]
  },

  InstanceVarDeclaration: {
    productions: [
      ['(IDENTIFIER)', 'ASSIGN', 'Expression'],
      ['(IDENTIFIER)']
    ]
  },

  StaticVarDeclarationStatement: {
    productions: [
      ['STATIC', 'VariableStatement', 'EndSt']
    ]
  },

  Accessor: {
    productions: [
      ['(GETS)', 'AccessorList'],
      ['(SETS)', 'AccessorList'],
      ['(ACCESSES)', 'AccessorList']
    ]
  },

  AccessorList: {
    productions: [
      ['AccessorVariable', 'COMMA', 'AccessorList'],
      ['AccessorVariable']
    ]
  },

  AccessorVariable: {
    productions: [
      ['(IDENTIFIER)']
    ]
  },

  FunctionDeclaration: {
    productions: [
      ['FUNCTION', '(IDENTIFIER)', 'Parameters', 'FunctionBody', 'END']
    ]
  },

  Closure: {
    productions: [
      ['CLOSURE', 'Parameters', 'FunctionBody', 'END']
    ],

    redefinitions: {
      Parameter: [
        ['ClosureParameter']
      ]
    }
  },

  ClosureParameter: {
    productions: [
      ['(IDENTIFIER)', 'ASSIGN', 'IdentifierReference'],
      ['IdentifierReference']
    ]
  },

  FunctionExpression: {
    productions: [
      ['FUNCTION', 'Parameters', 'FunctionBody', 'END'],
      ['FUNCTION', '(IDENTIFIER)', 'Parameters', 'FunctionBody', 'END']
    ]
  },

  Parameters: {
    productions: [
      ['EmptyList', '(?EmptyStatement)'],
      ['OPEN_PAREN', 'EmptyList', 'CLOSE_PAREN'],
      ['OPEN_PAREN', 'ParameterList', 'CLOSE_PAREN'],
      ['OPEN_PAREN_NO_EXPR', 'EmptyList', 'CLOSE_PAREN'],
      ['OPEN_PAREN_NO_EXPR', 'ParameterList', 'CLOSE_PAREN']
    ]
  },

  EmptyList: {
    productions: [
      []
    ]
  },

  ParameterList: {
    productions: [
      ['Parameter', 'COMMA', 'ParameterList'],
      ['Parameter']
    ]
  },

  Parameter: {
    productions: [
      ['VariableDeclaration']
    ]
  },

  AutoSetParam: {
    productions: [
      ['MEMBER', 'VariableDeclaration']
    ]
  },

  FunctionBody: {
    productions: [
      ['SourceElement', 'FunctionBody'],
      []
    ]
  },

  MemberIdentifier: {
    productions: [
      ['MEMBER', '(IDENTIFIER)']
    ]
  },

  ArrayLiteral: {
    productions: [
      ['OPEN_BRACKET', 'ArrayElementList', 'CLOSE_BRACKET']
    ]
  },

  ArrayElementList: {
    productions: [
      ['ArrayElement', 'COMMA', 'ArrayElementList'],
      ['ArrayElement']
    ]
  },

  ArrayElement: {
    productions: [
      ['Expression'],
      []
    ]
  },

  ObjectLiteral: {
    productions: [
      ['OPEN_BRACE', 'PropertyList', 'CLOSE_BRACE'],
      ['OPEN_BRACE', 'EmptyList', 'CLOSE_BRACE']
    ]
  },

  PropertyList: {
    productions: [
      ['Property', 'ObjPropDelim', 'PropertyList'],
      ['Property']
    ]
  },

  ObjPropDelim: {
    productions: [
      ['COMMA']
    ]
  },

  Property: {
    productions: [
      ['PropertyName', 'COLON', 'Expression'],
      ['PropertyName'],
      ['Symbol']
    ]
  },

  PropertyName: {
    productions: [
      ['StringLiteral'],
      ['(IDENTIFIER)'],
      ['(NUMERIC_LITERAL)']
    ]
  },

  Expression: {
    productions: [
      ['AssignmentExpression'],
      ['ParallelAssignmentExpression'],
      ['ConditionalExpression'],
      ['SimpleExpression']
    ]
  },

  AssignmentExpression: {
    productions: [
      ['MemberExpression', 'AssignmentOperator', 'Expression']
    ]
  },

  ParallelAssignmentExpression: {
    productions: [
      ['OPEN_PAREN', 'MemberExpressionList', 'CLOSE_PAREN', 'AssignmentOperator', 'OPEN_PAREN', 'ExpressionList', 'CLOSE_PAREN']
    ]
  },

  MemberExpressionList: {
    productions: [
      ['MemberExpression', 'COMMA', 'MemberExpressionList'],
      ['MemberExpression']
    ]
  },

  ExpressionList: {
    productions: [
      ['Expression', 'COMMA', 'ExpressionList'],
      ['Expression']
    ]
  },

  ConditionalExpression: {
    productions: [
      ['SimpleExpression', 'QUESTION', 'Expression', 'COLON', 'Expression']
    ]
  },

  SimpleExpression: {
    productions: [
      ['AdditiveExpression', 'RelativeOperator', 'SimpleExpression'],
      ['AdditiveExpression']
    ]
  },

  AdditiveExpression: {
    productions: [
      ['Term', 'MultiplicativeOperator', 'AdditiveExpression'],
      ['Term']
    ]
  },

  Term: {
    productions: [
      ['ExponentiationExpression', 'AdditiveOperator', 'Term'],
      ['ExponentiationExpression']
    ]
  },

  ExponentiationExpression: {
    productions: [
      ['UnaryExpression', 'EXPONENTIATION', 'ExponentiationExpression'],
      ['UnaryExpression']
    ],
  },

  UnaryExpression: {
    productions: [
      ['UnaryOperator', 'UnaryExpression'],
      ['IncrementExpression']
    ]
  },

  IncrementExpression: {
    productions: [
      ['PostfixIncrementExpression'],
      ['PrefixIncrementExpression'],
      ['MemberExpression']
    ]
  },

  PostfixIncrementExpression: {
    productions: [
      ['MemberExpression', '(DECREMENT)'],
      ['MemberExpression', '(INCREMENT)']
    ]
  },

  PrefixIncrementExpression: {
    productions: [
      ['(INCREMENT)', 'MemberExpression'],
      ['(DECREMENT)', 'MemberExpression']
    ]
  },

  MemberExpression:  {
    productions: [
      ['LeftHandSideExpression', 'MemberChain'],
      ['LeftHandSideExpression']
    ]
  },

  MemberChain: {
    productions: [
      ['Member', 'MemberChain'],
      ['Member']
    ]
  },

  Member: {
    productions: [
      ['ArrayDereference'],
      ['PropertyAccess'],
      ['ConditionalLoad'],
      ['Call'],
      ['BindExpression']
    ]
  },

  ConditionalLoad: {
    productions: [
      ['DOT_DOT', '(IDENTIFIER)']
    ]
  },

  Call: {
    productions: [
      ['OPEN_PAREN_NO_EXPR', 'EmptyList', 'CLOSE_PAREN'],
      ['OPEN_PAREN_NO_EXPR', 'ArgumentList', 'CLOSE_PAREN'],
      ['ParenLessCall']
    ],

    // This prevents calling a function with its arguments on the next
    // line.  It originally arose from the following ambiguity (but there
    // are obviously more):
    //
    //    if a
    //      function b
    //        return 1337
    //      end
    //    end
    //
    // In this case, because we support paren-less function calls and
    // complex statements, should this be parsed where the condition of
    // the 'if' statement is calling the function 'a' passing it function
    // 'b' as its parameter, or should the condition be simply 'a'?
    // We opt for the latter.
    lookahead: {
      'NEWLINE': false
    }
  },

  ParenLessCall: {
    productions: [
      ['WHITESPACE', 'ArgumentList']
    ],

    // Prevents strings such as "a - 1" from being parsed as
    // "a(-1)".
    redefinitions: {
      UnaryOperator: [
        ['(LOGICAL_NOT)'],
        ['(BITWISE_NOT)'],
        ['(DELETE)'],
        ['(TYPEOF)'],
        ['(UNARY_PLUS)'],
        ['(UNARY_MINUS)']
      ]
    }
  },

  PropertyAccess: {
    productions: [
      ['DOT',  '(IDENTIFIER)']
    ]
  },

  BindExpression:  {
    productions: [
      ['BIND', 'Call'],
      ['BIND']
    ]
  },

  ArrayDereference: {
    productions: [
      ['OPEN_BRACKET_NO_EXPR', 'Expression', 'CLOSE_BRACKET']
    ],

    // strings such as "a [- 1]" should be allowed
    redefinitions: {
      UnaryOperator: [
        ['(LOGICAL_NOT)'],
        ['(BITWISE_NOT)'],
        ['(DELETE)'],
        ['(TYPEOF)'],
        ['(PLUS)'],
        ['(UNARY_PLUS)'],
        ['(MINUS)'],
        ['(UNARY_MINUS)']
      ]
    }
  },

  LeftHandSideExpression:  {
    productions: [
      ['FunctionExpression'],
      ['Closure'],
      ['PrimaryExpression']
    ]
  },

  ArgumentList: {
    productions: [
      ['Expression', 'COMMA', 'ArgumentList'],
      ['Expression']
    ]
  },

  PrimaryExpression:  {
    productions: [
      ['This'],
      ['RegexLiteral'],
      ['StringLiteral'],
      ['Symbol'],
      ['IdentifierReference'],
      ['PrimitiveLiteralExpression'],
      ['MemberIdentifier'],
      ['ObjectLiteral'],
      ['ArrayLiteral'],
      ['NestedExpression']
    ]
  },

  This: {
    productions: [
      ['(THIS)']
    ]
  },

  Super: {
    productions: [
      ['(SUPER)']
    ]
  },

  Symbol: {
    productions: [
      ['COLON', 'StringLiteral'],
      ['COLON', '(IDENTIFIER)']
    ]
  },

  RegexLiteral: {
    productions: [
      ['(REGEX_LITERAL)']
    ]
  },

  StringLiteral: {
    productions: [
      ['DoubleStringLiteral'],
      ['SingleStringLiteral']
    ]
  },

  DoubleStringLiteral: {
    productions: [
      ['(DOUBLE_STRING_LITERAL)']
    ]
  },

  SingleStringLiteral: {
    productions: [
      ['(SINGLE_STRING_LITERAL)']
    ]
  },

  IdentifierReference: {
    productions: [
      ['(IDENTIFIER)']
    ]
  },

  PrimitiveLiteralExpression: {
    productions: [
      ['(TRUE)'],
      ['(FALSE)'],
      ['(NUMERIC_LITERAL)']
    ]
  },

  NestedExpression: {
    productions: [
      ['OPEN_PAREN', 'Expression', 'CLOSE_PAREN']
    ],

    // strings such as "a (- 1)" should be allowed
    redefinitions: {
      UnaryOperator: [
        ['(LOGICAL_NOT)'],
        ['(BITWISE_NOT)'],
        ['(DELETE)'],
        ['(TYPEOF)'],
        ['(PLUS)'],
        ['(UNARY_PLUS)'],
        ['(MINUS)'],
        ['(UNARY_MINUS)']
      ]
    }
  },

  AssignmentOperator: {
    nodeType: 'Operator',
    productions: [
      ['(MUL_EQUALS)'],
      ['(DIV_EQUALS)'],
      ['(MOD_EQUALS)'],
      ['(PLUS_EQUALS)'],
      ['(MINUS_EQUALS)'],
      ['(EXPONENTIATION_EQUALS)'],
      ['(CONDITIONAL_EQUALS)'],
      ['(SHIFTL_EQUALS)'],
      ['(SHIFTR_EQUALS)'],
      ['(LOGICAL_SHIFTR_EQUALS)'],
      ['(AND_EQUALS)'],
      ['(XOR_EQUALS)'],
      ['(OR_EQUALS)'],
      ['(ASSIGN)']
    ]
  },

  RelativeOperator: {
    nodeType: 'Operator',
    productions: [
      ['(EQUAL)'],
      ['(NOT_EQUAL)'],
      ['(LIKE)'],
      ['(UNLIKE)'],
      ['(LESS_THAN_EQUAL)'],
      ['(GREATER_THAN_EQUAL)'],
      ['(LESS_THAN)'],
      ['(GREATER_THAN)'],
      ['(COMPARE_TO)'],
      ['(LOGICAL_AND)'],
      ['(LOGICAL_OR)'],
      ['(BITWISE_AND)'],
      ['(BITWISE_OR)'],
      ['(XOR)'],
      ['(INSTANCEOF)']
    ]
  },

  UnaryOperator: {
    nodeType: 'Operator',
    productions: [
      ['(LOGICAL_NOT)'],
      ['(BITWISE_NOT)'],
      ['(DELETE)'],
      ['(TYPEOF)'],
      ['(PLUS)'],
      ['(UNARY_PLUS)'],
      ['(MINUS)'],
      ['(UNARY_MINUS)']
    ]
  },

  AdditiveOperator: {
    nodeType: 'Operator',
    productions: [
      ['(PLUS)'],
      ['(UNARY_PLUS)'],
      ['(MINUS)'],
      ['(UNARY_MINUS)']
    ]
  },

  MultiplicativeOperator: {
    nodeType: 'Operator',
    productions: [
      ['(ASTERISK)'],
      ['(FORWARD_SLASH)'],
      ['(MODULUS)']
    ]
  },

  StatementList:  {
    productions: [
      ['Statement', 'StatementList'],
      []
    ]
  },

  Statement: {
    productions: [
      ['TerminatedStatement'],
      ['ComplexStatement'],
      ['(?EmptyStatement)']
    ]
  },

  TerminatedStatement: {
    productions: [
      ['SimpleStatementNoFunction', 'EndSt']
    ]
  },

  ComplexStatement: {
    productions: [
      ['OneLineIfStatement'],
      ['OneLineUnlessStatement'],
      ['FunctionDeclaration'],
      ['IfStatement'],
      ['UnlessStatement'],
      ['IterationStatement'],
      ['WithStatement'],
      ['SwitchStatement'],
      ['LabeledStatement'],
      ['TryStatement']
    ]
  },

  SimpleStatementNoFunction: {
    productions: [
      ['VariableStatement'],
      ['ExternVariableStatement'],
      ['ExpressionStatement'],
      ['BreakStatement'],
      ['ReturnStatement'],
      ['ContinueStatement'],
      ['ThrowStatement'],
      ['DebuggerStatement'],
    ],

    lookahead: {
      'FUNCTION': false
    }
  },

  SimpleStatement: {
    productions: [
      ['VariableStatement'],
      ['ExpressionStatement'],
      ['BreakStatement'],
      ['ReturnStatement'],
      ['ContinueStatement'],
      ['ThrowStatement'],
      ['DebuggerStatement'],
    ]
  },

  EmptyStatement: {
    productions: [
      ['NEWLINE'],
      ['SEMI']
    ]
  },

  EndSt: {
    productions: [
      ['NEWLINE'],
      ['SEMI'],
      ['<<EOF>>']
    ]
  },

  ExpressionStatement: {
    productions: [
      ['Expression']
    ]
  },

  VariableStatement:  {
    productions: [
      ['VAR', 'VariableDeclarationList']
    ]
  },

  ExternVariableStatement:  {
    productions: [
      ['EXTERN', 'VAR', 'VariableDeclarationList']
    ]
  },

  VariableDeclarationList:  {
    productions: [
      ['VariableDeclaration', 'COMMA', 'VariableDeclarationList'],
      ['VariableDeclaration']
    ]
  },

  VariableDeclaration:  {
    productions: [
      ['(IDENTIFIER)', 'ASSIGN', 'Expression'],
      ['(IDENTIFIER)']
    ]
  },

  IfStatement:  {
    productions: [
      ['IF', 'Expression', 'BlockBody', 'ElseIfList', 'ElsePart', 'END'],
      ['IF', 'Expression', 'BlockBody', 'ElseIfList', 'END'],
      ['IF', 'Expression', 'BlockBody', 'ElsePart', 'END'],
      ['IF', 'Expression', 'BlockBody', 'END']
    ]
  },

  OneLineIfStatement: {
    productions: [
      ['SimpleStatement', 'IF', 'Expression']
    ]
  },

  UnlessStatement: {
    productions: [
      ['UNLESS', 'Expression', 'BlockBody', 'END']
    ]
  },

  OneLineUnlessStatement: {
    productions: [
      ['SimpleStatement', 'UNLESS', 'Expression']
    ]
  },

  BlockBody: {
    productions: [
      ['StatementList']
    ]
  },

  ElsePart: {
    productions: [
      ['ELSE', 'BlockBody']
    ]
  },

  ElseIfList: {
    productions: [
      ['ElseIf', 'ElseIfList'],
      ['ElseIf']
    ]
  },

  ElseIf: {
    productions: [
      ['ELSE', '(?NoNewline)', 'IF', 'Expression', 'BlockBody']
    ]
  },

  NoNewline: {
    productions: [
      ['WHITESPACE', 'NoNewLineLookaheadPart']
    ],
  },

  NoNewLineLookaheadPart: {
    productions: [
      []
    ],

    lookahead: {
      'NEWLINE': false
    }
  },

  IterationStatement: {
    productions: [
      ['WhileLoop'],
      ['UntilLoop'],
      ['DoUntilLoop'],
      ['DoWhileLoop'],
      ['ForLoop']
    ]
  },

  WhileLoop: {
    productions: [
      ['WHILE', 'Expression', 'BlockBody', 'END']
    ]
  },

  UntilLoop: {
    productions: [
      ['UNTIL', 'Expression', 'BlockBody', 'END']
    ]
  },

  // TODO(tjclifton): making these work will be a huge pain.

  DoWhileLoop: {
    productions: [
      ['DO', 'BlockBody', 'LOOP', '(?NoNewline)', 'WHILE', 'Expression', 'EndSt']
    ]
  },

  DoUntilLoop: {
    productions: [
      ['DO', 'BlockBody', 'LOOP', '(?NoNewline)', 'UNTIL', 'Expression', 'EndSt']
    ]
  },

  ForLoop: {
    productions: [
      ['FOR', 'ForLoopStructure', 'BlockBody', 'END']
    ]
  },

  ForLoopStructure: {
    productions: [
      // ['StandardForStructure'],
      ['ForInStructure'],
      ['MultipleForInStructure'],
      ['InflectedForStructure']
    ]
  },

  StandardForStructure: {
    productions: [
      ['ForLoopInitializer', 'FROM', 'OptionalExpression', 'TO', 'OptionalExpression']
    ]
  },

  ForLoopInitializer: {
    productions: [
      ['VariableStatement'],
      ['LeftHandSideExpression'],
      []
    ]
  },

  OptionalExpression: {
    productions: [
      ['Expression'],
      []
    ]
  },

  ForInStructure: {
    productions: [
      ['VariableDeclaration', 'IN', 'Expression', 'AT', 'VariableDeclaration'],
      ['VariableDeclaration', 'IN', 'Expression']
    ]
  },

  MultipleForInStructure: {
    productions: [
      ['VariableDeclaration', 'COMMA', 'VariableDeclaration', 'IN', 'Expression', 'AT', 'VariableDeclaration'],
      ['VariableDeclaration', 'COMMA', 'VariableDeclaration', 'IN', 'Expression']
    ]
  },

  InflectedForStructure: {
    productions: [
      ['IdentifierReference', 'AT', 'VariableDeclaration'],
      ['IdentifierReference']
    ]
  },

  ContinueStatement: {
    productions: [
      ['(CONTINUE)', '(IDENTIFIER)'],
      ['(CONTINUE)']
    ]
  },

  BreakStatement: {
    productions: [
      ['(BREAK)', '(IDENTIFIER)'],
      ['(BREAK)']
    ]
  },

  ReturnStatement: {
    productions: [
      ['(RETURN)', 'Expression'],
      ['(RETURN)']
    ]
  },

  WithStatement: {
    productions: [
      ['WITH', 'Expression', 'BlockBody', 'END']
    ]
  },

  SwitchStatement: {
    productions: [
      ['SWITCH', 'Expression', 'CaseBlock', 'END']
    ]
  },

  CaseBlock: {
    productions: [
      ['CaseList', 'OptDefaultCase']
    ]
  },

  CaseList: {
    productions: [
      ['Case', 'CaseList'],
      []
    ]
  },

  Case: {
    productions: [
      ['CASE', 'ExpressionList', 'COLON', 'BlockBody']
    ]
  },

  OptDefaultCase: {
    productions: [
      ['DefaultCase'],
      [],
    ]
  },

  DefaultCase: {
    productions: [
      ['DEFAULT', 'COLON', 'BlockBody']
    ]
  },

  LabeledStatement: {
    productions: [
      ['(IDENTIFIER)', 'COLON', 'Statement']
    ]
  },

  ThrowStatement: {
    productions: [
      ['(THROW)', 'Expression']
    ]
  },

  TryStatement: {
    productions: [
      ['TRY', 'BlockBody', 'OptCatch', 'OptFinally', 'END'],
    ]
  },

  OptCatch: {
    productions: [
      ['Catch'],
      []
    ]
  },

  OptFinally: {
    productions: [
      ['Finally'],
      []
    ]
  },

  Catch: {
    productions: [
      ['CATCH', 'ExceptionVarDeclaration', 'BlockBody'],
      ['CATCH', 'BlockBody']
    ]
  },

  ExceptionVarDeclaration: {
    productions: [
      ['(IDENTIFIER)']
    ]
  },

  Finally: {
    productions: [
      ['FINALLY', 'BlockBody']
    ]
  },

  DebuggerStatement: {
    productions: [
      ['(DEBUGGER)']
    ]
  }
};

