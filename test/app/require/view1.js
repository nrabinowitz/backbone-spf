define(function() {
    return spf.View.extend({
        className: 'view_one',
        render: function() {
            this.$el.html('<h2>ViewOne</h2><span>' + this.cid + '</span>')
        },
        events: {
            'click h2': 'increment'
        },
        increment: function() {
            window._counter = window._counter || 0;
            window._counter++;
        }
    });
});