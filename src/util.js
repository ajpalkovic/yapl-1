(function() {
  Array.prototype.insert = function(index, value) {
    this.splice(index, 0, value);
  };

  Array.prototype.prepend = function(value) {
    this.insert(0, value);
  };

  Array.prototype.peek = function() {
    return this[this.length - 1];
  };

  Array.prototype.mapTo = function(other) {
    var map = {};

    for (var i = 0; i < this.length; ++i) {
      map[this[i].toString()] = other[i];
    }

    return map;
  };

  Object.extend = function() {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
      deep = target;
      target = arguments[1] || {};
      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
      target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
      target = this;
      --i;
    }

    for ( ; i < length; i++ ) {
      // Only deal with non-null/undefined values
      if ( (options = arguments[ i ]) != null ) {
        // Extend the base object
        for ( name in options ) {
          src = target[ name ];
          copy = options[ name ];

          // Prevent never-ending loop
          if ( target === copy ) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
            if ( copyIsArray ) {
              copyIsArray = false;
              clone = src && jQuery.isArray(src) ? src : [];

            } else {
              clone = src && jQuery.isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[ name ] = jQuery.extend( deep, clone, copy );

          // Don't bring in undefined values
          } else if ( copy !== undefined ) {
            target[ name ] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  Function.create = function(name, arguments, body) {
    return eval('(function ' + name + '(' + arguments + ') {' + body + '})');
  };

  window.overload = function() {
    var fns = Array.prototype.slice.call(arguments, 0);
    var table = {};

    for (var i = 0, len = fns.length; i < len; ++i) {
      var fn = fns[i];
      table[fn.length] = fn;
    }

    return function() {
      var fn = table[arguments.length];
      return fn.apply(this, arguments);
    };
  };

  // Found the dictionary here: http://lotsacode.wordpress.com/2010/03/05/singularization-pluralization-in-c/
  var singularizationRules = [
    [/people/, 'person'],
    [/oxen/, 'ox'],
    [/children/, 'child'],
    [/feet/, 'foot'],
    [/teeth/, 'tooth'],
    [/geese/, 'goose'],
    // And now the more standard rules.
    [/(.*)ives?/, '$1ife'],
    [/(.*)ves?/, '$1f'],
    // ie, wolf, wife
    [/(.*)men$/, '$1man'],
    [/(.+[aeiou])ys$/, '$1y'],
    [/(.+[^aeiou])ies$/, '$1y'],
    [/(.+)zes$/, '$1'],
    [/([m|l])ice$/, '$1ouse'],
    [/matrices/, 'matrix'],
    [/indices/, 'index'],
    [/(.+[^aeiou])ices$/,'$1ice'],
    [/(.*)ices/, '$1ex'],
    // ie, Matrix, Index
    [/(octop|vir)i$/, '$1us'],
    [/(.+(s|x|sh|ch))es$/, '$1'],
    [/(.+)s/, '$1']
  ];

  window.singularize = function(word) {
    for (var i = 0; i < singularizationRules.length; ++i) {
      var singularizationRule = singularizationRules[i];

      var matches = word.match(singularizationRule[0]);
      if (!matches) continue;

      return word.replace(singularizationRule[0], singularizationRule[1]);
    }

    return word;
  };

  String.prototype.gsub = function(pattern, replacement) {
    var result = '', source = this, match;

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += replacement(match);
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  };

  Array.prototype.zip = function () {
    var args = $A(arguments);
    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return collections.pluck(index);
    });
  }

  Array.prototype.pluck = function(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  };

  Array.prototype.include = function(pattern) {
    return this.indexOf(pattern) > -1;
  }

  Array.prototype.last = Array.prototype.peek;
  Array.prototype.each = Array.prototype.forEach;

  window.$A = function(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  }

  window.toTagName = function(type) {
    return type[0].toLowerCase() + type.substring(1).gsub(/([A-Z])/, function(match) {
      return '_' + match[0].toLowerCase();
    });
  };

  window.$S = function(items, delimeter) {
    items = (typeof items === 'string') ? items.split(delimeter || '') : items;
    var object = {};

    $.each(items, function(index, value) {
      object[value] = true;
    });

    return object;
  }

  window.klass = overload(function(methods) {
      return klass({}, methods);
    },

    function(parent, methods) {
      return klass(window, parent, methods);
    },

    function(namespace, parent, methods) {
      var name = methods.initialize && methods.initialize.name;
      if (!name) throw 'Class cannot be created without a name';

      var klass = methods.initialize || function() {};

      namespace[name] = klass;

      if (parent) {
        var subclass = Function.create(parent.name, [], '');
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
      }

      for(var name in methods) {
        klass.prototype[name] = methods[name];
      }

      klass.prototype.constructor = klass;

      return klass;
    });
})();
