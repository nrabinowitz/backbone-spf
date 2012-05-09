define(function() {
    return spf.Layout.extend({
        el: '#layout_1',
        name: 'Required Layout',
        initialize: function() {
            this.$el.append('<div id="custom">custom</div>');
        }
    });
});