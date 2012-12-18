!function() {
  var ConditionalLoadTransformer = klass(pass, pass.Transformer, {
    initialize: function ConditionalLoadTransformer() {
      pass.Transformer.prototype.initialize.call(this, {
        'conditional_load': this.onConditionalLoad
      });
    },

    onConditionalLoad: function(conditionalLoad) {
      var nonConditionalLoad = undefined;
      var validPropertyAccess = undefined;

      // If we have more safe loads to do (chained conditional loads)
      if (conditionalLoad.member.is('conditional_load')) {
        // We recursively safe load the previous conditional load
        nonConditionalLoad = this.onConditionalLoad(conditionalLoad.member);

        // And we know that the right hand side of the safe load is our
        // valid property access upon which we can tack another property load
        // without error.
        //
        //   nonConditionalLoad
        //     |--------|
        // eg. (a && a.b) && a.b.c
        //           |--|    |--|
        //         validPropertyAccess
        validPropertyAccess = nonConditionalLoad.right;
      } else {
        // In the base case, where there are no more loads to recursively perform,
        // our non-conditional load and valid property access are one and the same.
        //
        //   nonConditionalLoad
        //     |
        // eg. a && a.b
        //          |
        //        validPropertyAccess
        nonConditionalLoad = validPropertyAccess = conditionalLoad.member;
      }

      // Now make a new valid property access with the old valid property access as the
      // property accesses upon which we tack our next property load.
      validPropertyAccess = new Node('property_access', {
        member: validPropertyAccess,
        memberPart: conditionalLoad.memberPart
      });

      // And we create a new 'check' that is evaluated at runtime and will short circuit if
      // the last property in nonConditional load does not exist.
      nonConditionalLoad = new Node('simple_expression', {
        left: nonConditionalLoad,
        operator: Node.operator(Token.LOGICAL_AND),
        right: validPropertyAccess
      });

      return nonConditionalLoad;
    }
  });
}();