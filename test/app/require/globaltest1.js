define(function() {
    return Backbone.View.extend({
        el: '#test1',
        initialize: function() {
            this.$el.html('GlobalTest1');
        }
    });
});