!function($) {
  var compiler = new Compiler();

  function generateYapl() {
    function traverse(ruleName) {
      var result = [];

      if (Grammar[ruleName]) {
        var productions = Grammar[ruleName];
        var randomIndex = Math.floor((Math.random() * (productions.length)));

        var production = productions[randomIndex];

        for (var i = 0; i < production.length; ++i) {
          result.push(traverse(production[i]));
        }
      }
    }

    return traverse('Program');
  };

  test('test it all', function() {

  });
}(jQuery);