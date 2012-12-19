!function() {
  // Makes it easy to create nodes that are expressions without having to
  // create a new node type.
  var expressionTypes = {
    'closure': true,
    'function_expression': true,
    'proc': true,
    'member_identifier': true,
    'array_literal': true,
    'object_literal': true,
    'assignment_expression': true,
    'parallel_assignment_expression': true,
    'conditional_expression': true,
    'simple_expression': true,
    'additive_expression': true,
    'term': true,
    'exponentiation_expression': true,
    'unary_expression': true,
    'postfix_increment_expression': true,
    'prefix_increment_expression': true,
    'new_expression': true,
    'property_access': true,
    'bind_expression': true,
    'array_dereference': true,
    'conditional_load': true,
    'call': true,
    'this': true,
    'super': true,
    'symbol': true,
    'regex_literal': true,
    'double_string_literal': true,
    'single_string_literal': true,
    'native_code_string_literal': true,
    'identifier_reference': true,
    'primitive_literal_expression': true,
    'nested_expression': true,
  };

  var Node = klass({
    initialize: function Node(type, children) {
      children = children || {};
      var isObj = children.length === undefined;

      this.type = type;
      this.parent = undefined;
      this.tags = {};
      this.childNames = {};

      this.tagAs(type);
      if (expressionTypes.hasOwnProperty(type)) {
        this.tagAs('expression');
      }

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
          return this.tags.hasOwnProperty(arguments[0])
        }

        var tags = arguments[0];
      } else {
        var tags = $A(arguments);
      }

      var _this = this;
      return tags.reduce(function(previous, tag) { return previous || _this.tags.hasOwnProperty(tag); }, false);
    },

    notNull: function() {
      return !this.isNull();
    },

    isNull: function() {
      return this.is('null');
    },

    tagAs: function(tagName) {
      this.tags[tagName] = true;
    },

    untagAs: function(tagName) {
      if (this.tags.hasOwnProperty(tagName)) delete this.tags[tagName];
    },

    append: function(child, name) {
      child = child || Node.nullNode();
      name = name || this.makeName(child);

      if (child.parent) child = child.clone();
      child.parent = this;

      this[name] = child;
      this.childNames[name] = true;
    },

    insertBefore: function(otherNode) {
      if (!otherNode.parent) return;

      if (otherNode.parent instanceof NodeList) {
        var index = otherNode.parent.children().indexOf(otherNode);
        otherNode.parent.insert(index, this);
      } else {
        otherNode.parent.append(otherNode);
      }
    },

    removeChild: function(child, replacement) {
      // Child can be the name of the child or the child itself.
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
        this.append(replacement, childName);
      } else {
        this[childName] = Node.nullNode();
        delete this.childNames[childName];
      }

      child.parent = undefined;
      return this;
    },

    remove: function() {
      if (this.parent) this.parent.removeChild(this);
      return this;
    },

    replaceWith: function(other) {
      if (this.parent) this.parent.removeChild(this, other);
      return this;
    },

    closest: function() {
      var current = this;
      while (current = current.parent) {
        if (current.is.apply(current, arguments)) break;
      }

      return current;
    },

    each: function(callback) {
      return this.children().each(callback);
    },

    children: function() {
      var children = [];
      var filters = $A(arguments);

      function doFilter(filter, child) {
        return (typeof filter === 'function') ? filter(child) : child.is(filter);
      }

      for (var childName in this.childNames) {
        switch (filters.length) {
          case 0:
            children.push(this[childName]);
            break;

          case 1:
            if (doFilter(filters[0], this[childName])) children.push(this[childName]);
            break;

          default:
            filters.each(function(filter) {
              if (doFilter(filters[0], this[childName])) {
                children.push(this[childName]);
              }
            });
        }
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
      var children = {};
      for (var childName in this.childNames) {
        children[childName] = this[childName];
      }

      var clone = new Node(this.type, children);
      for (var tagName in this.tags) {
        clone.tagAs(tagName);
      }

      return clone;
    }
  });

  Node.nullNode = function() {
    return new Node('null');
  };

  Node.statement = function(statement) {
    return new Node('terminated_statement', {
      statement: statement
    });
  };

  Node.assignment = function(left, right) {
    return new Node('assignment_expression', {
      left: left,
      operator: new Node('operator', [new TokenNode(Token.ASSIGN)]),
      right: right
    });
  };

  Node.variable = function(name, value) {
    var declaration = new Node('variable_declaration', {
      name: name,
      value: value
    });

    return Node.statement(
      new Node('variable_statement', [
        new NodeList('variable_declaration_list', [
          declaration
        ])
      ])
    );
  };

  Node.operator = function(type) {
    return new Node('operator', [new TokenNode(type)]);
  };

  var NodeList = klass(Node, {
    initialize: function NodeList(type, children) {
      Node.prototype.initialize.call(this, type);

      this.childNodes = [];
      this.append.apply(this, children);
    },

    append: function() {
      var childNodes = this._prepareChildNodes($A(arguments));
      this.childNodes = this.childNodes.concat(childNodes);
    },

    prepend: function() {
      var childNodes = this._prepareChildNodes($A(arguments));
      this.childNodes = childNodes.concat(this.childNodes);
    },

    insert: function() {
      var args = $A(arguments);
      var index = args.shift();

      var childNodes = this._prepareChildNodes(args);
      if (childNodes.length === 1) {
        this.childNodes.insert(index, childNodes[0]);
      } else {
        this.childNodes = this.childNodes.slice(0, index).concat(childNodes).concat(this.childNodes.slice(index));
      }
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
      this.childNodes.splice(index, 1);

      if (replacement) {
        var insertArgs = replacement.length ? replacement : [replacement];
        this.insert.apply(this, insertArgs.prepend(index));
      }

      return this;
    },

    each: function(callback) {
      var result;

      for (var i = 0; i < this.childNodes.length; ++i) {
        var lengthBefore = this.childNodes.length;
        result = callback(this.childNodes[i], i);

        var lengthDifference = lengthBefore - this.childNodes.length;
        if (lengthDifference > 0) i -= lengthDifference;
      }

      return result;
    },

    get: function(index) {
      return this.childNodes[index];
    },

    clone: function() {
      var clone = new NodeList(this.type, this.childNodes);
      for (var tagName in this.tags) {
        clone.tagAs(tagName);
      }

      return clone;
    },

    children: function() {
      if (!arguments.length) return this.childNodes;

      var children = [];
      var filters = $A(arguments);

      function doFilter(filter, child) {
        return (typeof filter === 'function') ? filter(child) : child.is(filter);
      }

      this.childNodes.each(function(childNode) {
        switch (filters.length) {
          case 1:
            if (doFilter(filters[0], childNode)) children.push(childNode);
            break;

          default:
            filters.each(function(filter) {
              if (doFilter(filter, childNode)) children.push(childNode);
            });
        }
      });

      return children;
    },

    size: function() {
      return this.childNodes.length;
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

    clone: function() {
      return new TokenNode(this.token);
    }
  });
}();
