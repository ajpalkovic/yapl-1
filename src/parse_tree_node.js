!function() {
  var Node = klass({
    initialize: function Node(type) {
      this.type = type;
      this.namedChildren = {};
      this.children = [];
      this.parent = undefined;
    },

    append: function(child, name) {
      this.children.append(child);
      if (name) this.namedChildren[name] = child;
    },

    clone: function() {
      var clonedNode = new Node(this.type);
      var namedChildren = $.extend({}, this.namedChildren);

      for (var name in namedChildren) {
        var child = namedChildren[name].clone();
        clonedNode.append(child);
      }

      return clonedNode;
    }
  });
};