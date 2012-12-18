!function() {
  var NEW_METHOD_NAME = 'new';

  function setDefaultValue(variableDeclaration, valueToken) {
    if (variableDeclaration.value.notNull()) return;

    var valueNode = new Node('primitive_literal_expression', {
      value: new TokenNode(valueToken)
    });

    variableDeclaration.value = valueNode;
  }

  var newVariableName = function() {
    var counts = {};

    return function(name) {
      counts[name] = counts[name] || 0;
      return name + counts[name]++
    };
  }();

  var SyntaxAugmentationTransformer = klass(pass, pass.ScopedTransformer, {
    initialize: function SyntaxAugmentationTransformer() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'for_each_structure': this.onForEachStructure,
        'multiple_for_each_structure': this.onMultipleForEachStructure,
        'inflected_for_structure': this.onInflectedForStructure,
        'symbol': this.onSymbol,
        'property_access': this.onPropertyAccess,
        'parallel_assignment_expression': this.onParallelAssignmentExpression,
        'regex_literal': this.onRegexLiteral,
        'unless_statement': this.onUnlessStatement,
        'until_loop': this.onUntilLoop,
        'do_until_loop': this.onDoUntilLoop,
        'case': this.onCase,
        'bind_expression': this.onBindExpression,
        'property': this.onProperty,
        'assignment_expression': this.onAssignmentExpression,
        'simple_expression': this.onSimpleExpression,
        'operator': this.onOperator,
        'one_line_if_statement': this.onOneLineIfStatement,
        'one_line_unless_statement': this.onOneLineUnlessStatement,
        'one_line_while_statement': this.onOneLineWhileStatement,
        'one_line_until_statement': this.onOneLineUntilStatement,
        'exponentiation_expression': this.onExponentiationExpression,
        'primitive_literal_expression': this.onPrimitiveLiteralExpression
      });
    },

    onForEachStructure: function(forEachStructure, scope) {
      var forLoop = forEachStructure.parent;
      var value = forEachStructure.value;
      var collection = forEachStructure.collection.remove();
      var index = forEachStructure.index.remove();
      var body = forLoop.body;

      var collectionToken = new TokenNode(newVariableName('__collection'));

      // Then we assign whatever the collection was to a variable so we can access it.
      Node.variable(
        collectionToken,
        collection
      ).insertBefore(forLoop);

      if (index.isNull()) {
        index = new Node('variable_declaration', {
          name: new TokenNode(newVariableName('__i')),
          value: new NullNode()
        });
      }

      setDefaultValue(index, new TokenNode(new Token({
        type: 'NUMERIC_LITERAL',
        value: 0
      })));

      var collectionDeref = new Node('array_dereference', {
        member: collectionToken,
        memberPart: index.name
      });

      var valueVariableAssignment = Node.variable(value.name, collectionDeref);
      body.prepend(valueVariableAssignment);

      return new Node('standard_for_structure', {
        varaible: Node.variable(index.name, index.value),

        condition: Node.statement(new Node('simple_expression', {
          left: index.name,

          operator: Node.operator(Token.LESS_THAN),

          right: new Node('property_access', {
            member: collectionToken,
            memberPart: new TokenNode('length')
          })
        })),

        increment: new Node('prefix_increment_expression', {
          operator: Node.operator(Token.INCREMENT),
          expression: index.name
        })
      });
    },

    onMultipleForEachStructure: function(multipleForEachStructure, scope) {
      var forLoop = multipleForEachStructure.parent;
      var key = multipleForEachStructure.key;
      var value = multipleForEachStructure.value;
      var collection = multipleForEachStructure.collection.remove();
      var index = multipleForEachStructure.index.remove();
      var body = forLoop.body;

      var collectionToken = new TokenNode(newVariableName('__collection'));

      // Then we assign whatever the collection was to a variable so we can access it.
      Node.variable(
        collectionToken,
        collection
      ).insertBefore(forLoop);

      if (index.isNull()) {
        index = new Node('variable_declaration', {
          name: new TokenNode(newVariableName('__i')),
          value: new NullNode()
        });
      }

      setDefaultValue(index, new TokenNode(new Token({
        type: 'NUMERIC_LITERAL',
        value: 0
      })));

      Node.variable(
        index.name,
        index.value
      ).insertBefore(forLoop);

      var collectionDeref = new Node('array_dereference', {
        member: collectionToken,
        memberPart: key.name
      });

      // Declare the value variable
      var valueVariable = Node.variable(value.name, collectionDeref);
      body.prepend(valueVariable);

      var indexIncrement = new Node('prefix_increment_expression', {
        operator: Node.operator(Token.INCREMENT),
        expression: index.name
      });

      body.append(indexIncrement);

      return new Node('for_in_structure', {
        value: new Node('variable_statement', [
          new Node('variable_declaration_list', [
            new Node('variable_declaration', {
              name: key.name,
              value: new NullNode()
            })
          ])
        ]),
        collection: collectionToken,
        index: new NullNode()
      });
    },

    onInflectedForStructure: function(inflectedForStructure, scope) {
      var collectionName = inflectedForStructure.collection.name;
      var singularToken = new TokenNode(singularize(collectionName.value));
      var value = new Node('variable_declaration', {
        name: singularToken,
        value: new NullNode()
      });

      inflectedForStructure.value = value;

      return this.onForEachStructure(inflectedForStructure, scope);
    },

    onSymbol: function(symbol, scope) {

    },

    onPropertyAccess: function(propertyAccess, scope) {
      if (propertyAccess.memberPart instanceof TokenNode && propertyAccess.memberPart.value === NEW_METHOD_NAME) {
        return new Node('new_expression', [propertyAccess.member]);
      }
    },

    onParallelAssignmentExpression: function(parallelAssignmentExpression, scope) {
      var leftHandSides = parallelAssignmentExpression.left;
      var rightHandSides = parallelAssignmentExpression.right;

      var assignments = new Node('parallel_assignment_list');

      leftHandSides.each(function(leftHandSide) {
        var rightHandSide = rightHandSides[i] ? rightHandSides[i] : new TokenNode(Token.UNDEFINED);

        assignments.append(Node.assignment(leftHandSide, rightHandSide));
      });

      return assignments;
    },

    onRegexLiteral: function(regexLiteral, scope) {
      var regexText = regexLiteral.token.value;

      var newRegexToken = new TokenNode(new Token({
        type: 'REGEX_LITERAL',
        value: regexText.replace(/\s+/g, '') // Strips the whitespace
      }));

      return new Node('regex_literal', [newRegexToken]);
    },

    onUnlessStatement: function(unlessStatement, scope) {
      var condition = unlessStatement.condition;
      var body = unlessStatement.body;

      var negation = new Node('unary_expression', {
        operator: Node.operator(Token.LOGICAL_NOT),
        expression: condition
      });

      return new Node('if_statement', {
        condition: negation,
        body: body
      });
    },

    onUntilLoop: function(untilLoop, scope) {
      var condition = untilLoop.condition;
      var body = untilLoop.body;

      var negation = new Node('unary_expression', {
        operator: Node.operator(Token.LOGICAL_NOT),
        expression: condition
      });

      return new Node('while_loop', {
        condition: negation,
        body: body
      });
    },

    onDoUntilLoop: function(doUntilLoop, scope) {
      var body = doUntilLoop.body;
      var condition = doUntilLoop.condition;

      var negation = new Node('unary_expression', {
        operator: Node.operator(Token.LOGICAL_NOT),
        expression: condition
      });

      return new Node('do_while_loop', {
        body: body,
        condition: negation
      });
    },

    onCase: function(caseElement, scope) {
      var expressions = caseElement.expressions;
      var body = caseElement.body;

      if (expressions.children().length === 1) return;

      var newCases = [];
      var length = expressions.size();

      expressions.each(function(expression, i) {

        // The last case in the fall-through has the body.
        var newCase = new Node('case', {
          expression: expression
        });

        if (i === length - 1) newCase.body = body;

        newCases.push(newCases)
      });

      return newCases;
    },

    onBindExpression: function(bindExpression, scope) {
      var member = bindExpression.member;
      var parameters = bindExpression.memberPart;

      // We don't want an 'EmptyList' because it won't get printed.
      if (!parameters.size()) parameters = new Node('argument_list');

      parameters.prepend(new TokenNode(Token.THIS));

      var bindFunction = new Node('property_access', {
        member: member,
        memberPart: new TokenNode('bind')
      });

      return new Node('call', {
        member: bindFunction,
        memberPart: parameters
      });
    },

    onProperty: function(property, scope) {
      if (property.value.notNull()) return;

      var name = property.name;

      return new Node('property', {
        name: name,
        value: new Node('primitive_literal_expression', {
          value: new TokenNode(Token.TRUE)
        })
      });
    },

    onAssignmentExpression: function(assignmentExpression, scope) {
      var left = assignmentExpression.left;
      var operator = assignmentExpression.operator;
      var right = assignmentExpression.right;

      switch (operator.token.tokenType) {
        case 'EXPONENTIATION_EQUALS':
          var exponentiation = new Node('exponentiation_expression', {
            left: left,
            right: right
          });

          exponentiation = this.onExponentiationExpression(exponentiation, scope);
          return Node.assignment(left, exponentiation);

        case 'CONDITIONAL_EQUALS':
          return Node.assignment(
            left,
            new Node('simple_expression', {
              left: left,
              operator: Node.operator(Token.LOGICAL_OR),
              right: right
            })
          );
      }
    },

    onSimpleExpression: function(simpleExpression, scope) {
      var left = simpleExpression.left;
      var operator = simpleExpression.operator;
      var right = simpleExpression.right;

      switch (operator.token.tokenType) {
        case 'COMPARE_TO':
          return new Node('nested_expression', [
            new Node('conditional_expression', {
              condition: new Node('simple_expression', {
                left: left,
                operator: Node.operator(Token.GREATER_THAN),
                right: right
              }),

              truePart: new Node('primitive_literal_expression', {
                value: new TokenNode(new Token({type: 'NUMERIC_LITERAL', value: '1'}))
              }),

              falsePart: new Node('conditional_expression', {
                condition: new Node('simple_expression', {
                  left: left,
                  operator: Node.operator(Token.LESS_THAN),
                  right: right
                }),

                truePart: new Node('unary_expression', {
                  operator: Node.operator(new Token({type: 'UNARY_MINUS', value: '-'})),
                  expression: new Node('primitive_literal_expression', {
                    value: new TokenNode(new Token({type: 'NUMERIC_LITERAL', value: '1'}))
                  })
                }),

                falsePart: new Node('primitive_literal_expression', {
                  value: new TokenNode(new Token({type: 'NUMERIC_LITERAL', value: '1'}))
                }),
              })
            })
          ]);
      }
    },

    onOperator: function(operator, scope) {
      switch (operator.token.tokenType) {
        case 'EQUAL':
          return Node.operator(new Token({type: 'TRIPPLE_EQUAL', value: '==='}));
        case 'LIKE':
          return Node.operator(Token.EQUAL);
        case 'UNLIKE':
          return Node.operator(Token.NOT_EQUAL)
      }
    },

    onOneLineIfStatement: function(oneLineIfStatement, scope) {
      return new Node('if_statement', {
        condition: oneLineIfStatement.condition,
        body: Node.statement(oneLineIfStatement.body)
      });
    },

    onOneLineUnlessStatement: function(oneLineUnlessStatement, scope) {
      return this.onUnlessStatement(new Node('unless_statement', {
        condition: oneLineUnlessStatement.condition,
        body: Node.statement(oneLineIfStatement.body)
      }));
    },

    onOneLineWhileStatement: function(oneLineWhileStatement, scope) {
      return new Node('while_loop', {
        condition: oneLineWhileStatement.condition,
        body: Node.statement(oneLineWhileStatement.body)
      });
    },

    onOneLineUntilStatement: function(oneLineUntilStatement, scope) {
      return this.onUntilLoop(new Node('until_loop', {
        condition: oneLineUntilStatement.condition,
        body: Node.statement(oneLineUntilStatement.body)
      }));
    },

    onExponentiationExpression: function(exponentiationExpression, scope) {
      var left = exponentiationExpression.left;
      var right = exponentiationExpression.right;

      return new Node('call', {
        member: new Node('property_access', {
          member: new TokenNode('Math'),
          memberPart: new TokenNode('pow')
        }),

        memberPart: new Node('argument_list', [
          left,
          right
        ])
      });
    },

    onPrimitiveLiteralExpression: function(primitiveLiteralExpression, scope) {
      if (primitiveLiteralExpression.parent.is('property_access')) {
        return new Node('nested_expression', [primitiveLiteralExpression]);
      }
    }
  });
}();
