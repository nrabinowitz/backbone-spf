define(function() {
    return spf.View.extend({
        className: 'view_two',
        render: function() {
            this.$el.html('<h2>ViewTwo</h2><span>' + this.cid + '</span>')
        }
    });
});