var ViewOne = spf.View.extend({
    render: function() {
        this.$el.html('ViewOne')
    }
});

var ViewTwo = spf.View.extend({
    render: function() {
        this.$el.html('ViewTwo')
    }
});

var LayoutView = spf.Layout.extend({
    el: '#layout_1',
    initialize: function() {
        this.$el.append('<div id="custom">custom</div>');
    }
});

var GlobalTest1 = Backbone.View.extend({
    el: '#test1',
    initialize: function() {
        this.$el.html('GlobalTest1');
    }
});

var GlobalTest2 = Backbone.View.extend({
    el: '#test2',
    initialize: function() {
        this.$el.html('GlobalTest2');
    }
});