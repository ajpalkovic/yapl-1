!function($) {
  function makeStringLiteral(quote, string, line) {
    var type = quote === '"' ? 'DOUBLE_STRING_LITERAL' : 'SINGLE_STRING_LITERAL';

    var token = new Token({
      type: type,
      value: quote + string + quote,
      line: line // Need to have this when the syntax aug. pass tries to figure out
                 // if this string spans multiple lines.
    });

    return $node(type.toLowerCase(), [$token(token)]);
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
      return $node('nested_expression', [parser.parse(code, lineOffset)]);
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

            var before = string.substring(endOfLastInterpolation, i);
            var code = string.substring(i + 2, end);

            if (before.length) interpolations.push(makeStringLiteral('"', before, lineOffset));

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
    var stringText = stringLiteral.children('token').text();
    // Remove the quotes.
    stringText = stringText.substring(1, stringText.length - 1);

    var startingLineNumber = parseInt(stringLiteral.children('token').attr('line'));
    var lines = stringText.split('\n');

    var initialIndentation = compiler.parser.lexer.getIndent(startingLineNumber).value;

    var newLines = lines.splice(1).map(function(line, i) {
      if (!line) return line;

      // We add 1 because we are ignoring the first line.
      var lineNumber = startingLineNumber + i + 1;

      try {
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
      var parent = nativeCodeStringLiteral.parent();
      nativeCodeStringLiteral.remove();

      var newLines = fixIndentation(nativeCodeStringLiteral);
      var newCodeStringToken = Token.identify("'" + newLines.join('\n') + "'").token;

      nativeCodeStringLiteral = $node('native_code_string_literal', [
        newCodeStringToken
      ], [
        'code'
      ]);

      if (parent.is('terminated_statement')) {
        parent.replaceWith(nativeCodeStringLiteral);
      }
    },

    onStringLiteral: function(stringLiteral, scope, compiler) {
      var quote = stringLiteral.children('token').text()[0];
      var newLines = fixIndentation(stringLiteral);

      return makeStringLiteral(quote, newLines.join('\\n'), stringLiteral.children('token').attr('line'));
    },

    onDoubleStringLiteral: function(stringLiteral, scope, compiler) {
      // We make sure we indent properly before interpolating the string.
      stringLiteral = this.onStringLiteral(stringLiteral, scope, compiler);

      var string = stringLiteral.children('token').text();
      var line = parseInt(stringLiteral.children('token').attr('line'));
      var interpolations = interpolate(string, line, scope);

      if (!interpolations.length) return stringLiteral;

      var concatenation = makeStringLiteral("'", '', line);
      var seenStringLiteral = false;

      interpolations.slice(0).each(function(interpolation, i) {
        // Disregarding the empty string we added to the front of the interpolations,
        // we want to see if there were any strings in the interpolation, because if there
        // aren't we want to make sure we keep the blank string so everything is
        // coerced into a string
        seenStringLiteral = seenStringLiteral || (interpolation.is('single_string_literal') && i > 0);

        concatenation = $node('additive_expression', [
          concatenation,
          $node('operator', [$token(new Token({type: 'PLUS', value: '+'}))]),
          interpolation
        ], [
          'left',
          'operator',
          'right'
        ]);
      });

      return concatenation;
    }
  });
}(jQuery);
