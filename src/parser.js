var Parser = (function($) {
  var INDENT = [''];

  function dbg() {
    return;
    var args = Array.prototype.slice.call(arguments, 0);
    args.splice(0, 0, INDENT[INDENT.length - 1]);
    console.log.apply(console, args);
  }

  function dbg_i() {
    arguments.length && dbg.apply(this, arguments);
    INDENT.push(INDENT[INDENT.length - 1] + '    ');
  }

  function dbg_u() {
    arguments.length && dbg.apply(this, arguments);
    INDENT.pop();
  }

  return Class.create({
    initialize: function Parser() {
      this.lexer = undefined;
      this.cache = {};
    },
    
    parse: function(input) {
      var _this = this;

      this.lexer = new Lexer(input);
      var tree = this.__parse('Program', 0);

      if (!tree) {
        this.error();
      }

      return tree;
    },

    __parse: function(currentRule, startPos) {
      dbg_i('o Parsing', currentRule, '{');

      var cached = (this.cache[currentRule] || (this.cache[currentRule] = []))[startPos];
      if (cached) {
        dbg('**** Cache hit! Parsed this rule at position', startPos, 'in token stream!');
        this.lexer.currentPos = cached.nextPos;

        dbg_u();
        dbg('}');
        return cached.result;
      }

      var rule = Grammar[currentRule];

      // If a rule has no lookahead requirements, or it does, but the next token in the lexer
      // is in the lookahead map positively, then we have fufilled the lookahead condition.
      // If it is in the map but negatively, then it fails.  If there was not another token in
      // the stream, we can just say it passed and let the later logic handle it.
      var nextToken = this.lexer.peek();
      var lookaheadFufilled = !nextToken || (!rule.lookahead || (rule.lookahead[nextToken.type] != false));

      // If the lookahead wasn't fufilled, then we consider the parsing a failure.
      var cacheEntry = undefined;
      if (lookaheadFufilled) {
        cacheEntry = this.__parseRule(rule, startPos);
      } else {
        dbg('. Negative lookahead prohibits', nextToken.type, '! Moving on...');
      }

      cacheEntry = cacheEntry || {
        nextPos: startPos,
        result: undefined
      };

      dbg_u();
      dbg('}');

      return (this.cache[currentRule][startPos] = cacheEntry).result;
    },

    __parseRule: function(rule, startPos) {
      for (var i = 0, numProds = rule.productions.length; i < numProds; ++i) {
        var production = rule.productions[i];

        dbg_i('- Current production:', production);

        var parseFailed = false;
        var parseResults = [];

        for (var j = 0, numElements = production.length; j < numElements; ++j) {
          var expectedTokenType = production[j];

          if (Grammar[expectedTokenType]) {
            var parseResult = this.__parse(expectedTokenType, this.lexer.currentPos);
            var shouldCapture = expectedTokenType.match(/^\?\:/);

            if (parseResult && shouldCapture) parseResults.push(parseResult);
            parseFailed = !parseResult;
          } else {
            var matchResult = this.__match(expectedTokenType);
            if (matchResult) {
              parseResults.push(matchResult);
              
              if (!matchResult.advance) j--;
            }

            parseFailed = !matchResult.matched;
          }

          if (parseFailed) break;
        }

        if (!parseFailed) {
          dbg('- Successfully parsed production!!');
          dbg_u();

          var result = rule.onParse.apply(parseResults);

          // After calling a parse function, the lexer position could have
          // advanced, so that would be the 'next position' of the lexer
          // if we ever end up running this parse function at the same
          // position again.
          return {
            nextPos: this.lexer.currentPos,
            result: 'yay'
          };
        } else {
          dbg('- Failed to parse production!!');
          dbg_u();

          // We need to reset the lexer to where we were when
          // we started parsing the current rule because the previous
          // production failed to parse.
          this.lexer.currentPos = startPos;
        }
      }

      return undefined;
    },

    __match: function(expectedTokenType) {
      var lexedToken = this.lexer.next();
      var advance = true;

      // Hit the end of the token stream so we failed.
      if (!lexedToken) return false;

      var prohibited = (expectedTokenType[0] === '!');
      var matchFailed = ((expectedTokenType !== lexedToken.type) || prohibited);

      if (matchFailed && !lexedToken.optional) {
        dbg('. Failed to match', expectedTokenType, 'to', lexedToken.type, 'from lexer! Moving on...');
      } else if (matchFailed && lexedToken.optional) {
        // If we had a mismatch and the token from the lexer was optional,
        // we want to make sure we reparse the terminal token we just tried
        // to match with whatever the lexer has next.
        advance = false;
        dbg('. Hit optional token', lexedToken.type);
      } else {
        dbg('. Matched', expectedTokenType, 'to', lexedToken.type, 'from lexer! Moving on...');
      }

      // If the match didn't fail/it did fail but the offending token was optional,
      // and there wasn't a negative lookahead violation, then we successfully matched.
      // Else we didn't...
      return {
        matched: (!matchFailed || lexedToken.optional),
        advance: advance
      };
    },

    error: function() {
      var last = this.lexer.last();
      throw ['ParseError: Unexpected', last.type, 'at line', last.line + 1].join(' ');
    }
  });
})(jQuery);
