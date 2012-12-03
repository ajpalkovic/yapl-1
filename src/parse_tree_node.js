!function() {
  var Node = klass({
    initialize: function Node(type) {
      this.type = type;
      this.children = [];
      this.parent = undefined;
    },

    is: function(type) {
      return this.type === type;
    },

    append: function(child, name) {
      this.children.append(child);
      if (name) this[name] = child;

      child.parent = this;
    },

    clone: function() {
      return $.extend({}, this);
    }
  });
};