!function() {
  var Node = klass({
    initialize: function Node(type, children) {
      children = children || {};

      this.type = type;
      this.parent = undefined;
      this.tags = {};
      this.childNames = {};

      this.tagAs(type);

      for (var childName in children) {
        this.append(children[childName], childName);
      }
    },

    is: function(tagName) {
      return this.tags[tagName];
    },

    tagAs: function(tagName) {
      this.tags[tagName] = true;
    },

    append: function(child, name) {
      if (child) {
        child = child.clone();
        child.parent = this;
      }

      this[name] = child;
      this.childNames[name] = true;
    },

    removeChild: function(child) {
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
      delete this[childName];
      delete this.childNames[childName];

      return child;
    },

    remove: function() {
      return this.parent.removeChild(this);
    },

    children: function() {
      var children = [];

      for (var childName in this.childNames) {
        children.push(this[childName]);
      }

      return children;
    },

    clone: function() {
      return Object.extend({}, this);
    }
  });

  var NodeList = klass(Node, {
    initialize: function NodeList(type) {
      Node.prototype.initialize.call(this, type);

      this.childNodes = [];
    },

    _setParent: function(children) {
      for (var i = 0; i < children.length; ++i) {
        if (children[i]) children[i].parent = this;
      }
    },

    append: function() {
      var children = $A(arguments).filter(function(child) { return !!child; });
      this._setParent(children);

      this.childNodes = this.childNodes.concat(children);
    },

    prepend: function() {
      var children = $A(arguments).filter(function(child) { return !!child; });
      this._setParent(children);

      this.childNodes = children.concat(this.childNodes);
    },

    removeChild: function(child) {
      var index = this.childNodes.indexOf(child);
      return this.childNodes.splice(index, 1)[0];
    },

    children: function() {
      return this.childNodes;
    }
  });

  var TokenNode = klass(Node, {
    initialize: function TokenNode(token) {
      Node.prototype.initialize.call(this, 'token');

      this.token = token;
    }
  });
}();
