!function() {
  var Node = klass({
    initialize: function Node(type, children) {
      children = children || {};
      var isObj = children.length === undefined;

      this.type = type;
      this.parent = undefined;
      this.tags = {};
      this.childNames = {};

      this.tagAs(type);

      var _this = this

      if (isObj) {
        children.each(function(key, child) {
          _this.append(child, key);
        });
      } else {
        children.each(function(child) {
          _this.append(child);
        });
      }
    },

    setType: function(type) {
      this.untagAs(this.type);
      this.type = type;
      this.tagAs(type);
    },

    is: function() {
      // Most cases will just pass a single tag in.
      if (arguments.length === 1) {
        if (typeof arguments[0] === 'string' || arguments[0] instanceof String) {
          return this.tags[arguments[0]]
        }

        var tags = arguments[0];
      } else {
        var tags = $A(arguments);
      }

      var _this = this;
      return tags.reduce(function(previous, tag) { return previous || _this.tags[tag]; }, false);
    },

    tagAs: function(tagName) {
      this.tags[tagName] = true;
    },

    untagAs: function(tagName) {
      if (this.tags[tagName]) delete this.tags[tagName];
    },

    append: function(child, name) {
      child = child || new NullNode();
      name = name || this.makeName(child);

      if (child.parent) child = child.clone();
      child.parent = this;

      this[name] = child;
      this.childNames[name] = true;
    },

    removeChild: function(child, replacement) {
      var childName = child;

      if (child instanceof Node) {
        for (var name in this) {
          var value = this[name];
          if (!(value instanceof Node)) continue;

          if (value == child) {
            childName = name;
            break;
          }
        }
      }

      child = this[childName];

      if (replacement) {
        this[childName] = replacement;
      } else {
        delete this[childName];
        delete this.childNames[childName];
      }

      child.parent = undefined;
      return child;
    },

    remove: function() {
      return this.parent && this.parent.removeChild(this);
    },

    replaceWith: function(other) {
      return this.parent && this.parent.removeChild(this, other);
    },

    closest: function() {
      var current = this;
      while (current = current.parent) {
        if (current.is.apply(this, arguments)) break;
      }

      return current;
    },

    children: function() {
      var children = [];

      for (var childName in this.childNames) {
        children.push(this[childName]);
      }

      return children;
    },

    makeName: function() {
      var names = {};

      return function (child) {
        var name = child.type.gsub(/(_)(.)/, function(match) {
          return match[2].toUpperCase();
        });

        var count = names[name]++;
        name += count ? count : '';

        return name;
      };
    }(),

    clone: function() {
      return Object.extend({}, this);
    }
  });

  var NodeList = klass(Node, {
    initialize: function NodeList(type) {
      Node.prototype.initialize.call(this, type);

      this.childNodes = [];
    },

    append: function() {
      var childNodes = this._prepareChildNodes($A(arguments));
      this.childNodes = this.childNodes.concat(childNodes);
    },

    prepend: function() {
      var childNodes = this._prepareChildNodes($A(arguments));
      this.childNodes = childNodes.concat(this.childNodes);
    },

    _prepareChildNodes: function(childNodes) {
      var _this = this;

      return childNodes.filter(function(childNode) { return !!childNode; }).map(function(childNode) {
        if (childNode.parent) childNode = childNode.clone();

        childNode.parent = _this;
        return childNode;
      });
    },

    removeChild: function(child, replacement) {
      child.parent = undefined;

      var index = this.childNodes.indexOf(child);
      return (replacement ? this.childNodes.splice(index, 1, replacement) : this.childNodes.splice(index, 1))[0];
    },

    each: function(callback) {
      return this.childNodes.each(callback);
    },

    children: function() {
      return this.childNodes;
    }
  });

  var NullNode = klass(Node, {
    initialize: function NullNode() {
      Node.prototype.initialize.call(this, 'null');
    }
  });

  var TokenNode = klass(Node, {
    initialize: function TokenNode(token) {
      Node.prototype.initialize.call(this, 'token');

      // Convenience for creating tokens of identifiers.
      if (typeof token === 'string' || token instanceof String) {
        token = new Token({
          type: 'IDENTIFIER',
          value: token
        });
      }

      this.token = token;
      this.value = token.value;
      this.line = token.line;
      this.tokenType = token.type;
    },
  });
}();
