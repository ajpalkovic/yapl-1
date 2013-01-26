!function() {
  function makeStringLiteral(quote, string, line) {
    var type = quote === '"' ? 'DOUBLE_STRING_LITERAL' : 'SINGLE_STRING_LITERAL';

    var token = new Token({
      type: type,
      value: quote + string + quote,
      line: line // Need to have this when the syntax aug. pass tries to figure out
                 // if this string spans multiple lines.
    });

    return new Node(type.toLowerCase(), [new TokenNode(token)]);
  }

  function interpolate(string, line, scope) {
    // Remove the quotes.
    var quote = string[0];
    string = string.substring(1, string.length - 1);

    var parser = new InterpolationParser();

    function balanceInterpolation(index) {
      for (var i = index; i < string.length; ++i) {
        switch (string[i]) {
          case '{':
            var end = balanceInterpolation(i + 1);
            i = end;
          case '}':
            return i;
        }
      }
    }

    function parseCode(code, lineOffset) {
      var codeTree = parser.parse(code, lineOffset);
      var noFunction = codeTree.size() <= 1
        && codeTree.get(0).is('terminated_statement')
        && codeTree.get(0).statement.is('expression');

      var interpolatedCode = noFunction ? codeTree.get(0).statement : new Node('proc', {
        parameters: null,
        body: codeTree
      });

      return new Node('nested_expression', [
        interpolatedCode
      ]);
    }

    var interpolations = [];
    var endOfLastInterpolation = 0;
    var lineOffset = line;

    for (var i = 0; i < string.length; ++i) {
      switch (string[i]) {
        case '\\':
          lineOffset += (string[i + 1] === 'n');
          ++i;
          break;

        case '#':
          if (string[i + 1] === '{') {
            var end = balanceInterpolation(i + 1);
            if (end === undefined) {
              throw new error.UnbalancedStringInterpolation(lineOffset);
            }

            var before = string.substring(endOfLastInterpolation, i);
            var code = string.substring(i + 2, end);

            if (before.length) interpolations.push(makeStringLiteral('"', before, line));

            interpolations.push(parseCode(code, lineOffset));

            endOfLastInterpolation = end + 1;
          }
      }
    }

    // Only add the rest of the string if there are other interpolations.  This way,
    // we wont have to do an unecessary join on an array to build the new string when
    // the result is just the string itself.
    if (interpolations.length) {
      var rest = string.substring(endOfLastInterpolation);
      if (rest.length) interpolations.push(makeStringLiteral('"', rest, line));
    }

    return interpolations;
  }

  function fixIndentation(stringLiteral) {
    var stringText = stringLiteral.children()[0];
    var startingLineNumber = parseInt(stringText.line);
    var lines = stringText.value.substring(1, stringText.value.length - 1).split('\n');

    // TODO: this breaks when we use string literals in interpolations because
    // it will ask the wrong lexer for the indentation.  We need to make sure we recursively
    // parse interpolations with their own compilers so they have their own lexers.
    var initialIndentation = compiler.parser.lexer.getIndent(startingLineNumber).value;

    var newLines = lines.splice(1).map(function(line, i) {
      if (!line) return line;

      // We add 1 because we are ignoring the first line.
      var lineNumber = startingLineNumber + i + 1;

      try {
        // Should grab the whitespace at the beginning of the line.
        var indentationToken = Token.identify(line).token;
      } catch (e) {
        // Whatever was at the beginning of the line in the string was not a proper
        // lexical token, but since we are in a string and not in the source code,
        // it doesn't matter, so we just say the indentation is empty.
        //
        // eg. x = '
        //     `
        //     '
        var indentationToken = new Token({type: 'WHITESPACE', value: '', line: lineNumber});
      }

      var indentation = indentationToken.value;

      if (indentation.length < initialIndentation.length) {
        // TODO: throw an error, the indentation was off.
        throw new error.IncorrectIndentation(lineNumber);
      }

      return line.substring(initialIndentation.length);
    });

    newLines.prepend(lines[0]);
    return newLines;
  }

  var StringInterpolationPass = klass(pass, pass.ScopedTransformer, {
    initialize: function StringInterpolationPass() {
      pass.ScopedTransformer.prototype.initialize.call(this, {
        'native_code_string_literal': this.onNativeCodeStringLiteral,
        'double_string_literal': this.onDoubleStringLiteral,
        'single_string_literal': this.onStringLiteral
      });
    },

    onNativeCodeStringLiteral: function(nativeCodeStringLiteral, scope, compiler) {
      var parent = nativeCodeStringLiteral.parent;
      nativeCodeStringLiteral.remove();

      var newLines = fixIndentation(nativeCodeStringLiteral);
      var newCodeStringToken = new Token({type: 'SINGLE_STRING_LITERAL', value: "'" + newLines.join('\n') + "'"});

      nativeCodeStringLiteral = new Node('native_code_string_literal', {
        code: new TokenNode(newCodeStringToken)
      });

      if (parent.is('terminated_statement')) {
        parent.replaceWith(nativeCodeStringLiteral);
      }
    },

    onStringLiteral: function(stringLiteral, scope, compiler) {
      var quote = stringLiteral.token.value[0];
      var newLines = fixIndentation(stringLiteral);

      return makeStringLiteral(quote, newLines.join('\\n'), stringLiteral.token.line);
    },

    onDoubleStringLiteral: function(stringLiteral, scope, compiler) {
      // We make sure we indent properly before interpolating the string.
      stringLiteral = this.onStringLiteral(stringLiteral, scope, compiler);

      var string = stringLiteral.token;
      var line = parseInt(stringLiteral.token.line);
      var interpolations = interpolate(string.value, line, scope);

      if (!interpolations.length) return stringLiteral;

      var concatenation = makeStringLiteral("'", '', line);
      var seenStringLiteral = false;

      interpolations.slice(0).each(function(interpolation, i) {
        // Disregarding the empty string we added to the front of the interpolations,
        // we want to see if there were any strings in the interpolation, because if there
        // aren't we want to make sure we keep the blank string so everything is
        // coerced into a string
        seenStringLiteral = seenStringLiteral || (interpolation.is('single_string_literal') && i > 0);

        concatenation = new Node('additive_expression', {
          left: concatenation,
          operator: new Node('operator', [new TokenNode(new Token({type: 'PLUS', value: '+'}))]),
          right: interpolation
        });
      });

      return concatenation;
    }
  });
}();
