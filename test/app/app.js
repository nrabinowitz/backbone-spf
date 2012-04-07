var state = spf.state;

var ViewOne = spf.View.extend({
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

var ViewTwo = spf.View.extend({
    className: 'view_two',
    render: function() {
        this.$el.html('<h2>ViewTwo</h2><span>' + this.cid + '</span>')
    }
});

var AttachingViewOne = spf.View.extend({
    el: '#slot_1_2',
    render: function() {
        this.$el.html('<h2>AttachingView</h2><span>' + this.cid + '</span>')
    }
});

var AttachingViewTwo = spf.View.extend({
    el: '#slot_1_3',
    clearDom: false,
    events: {
        'click span': 'setParam'
    },
    setParam: function() {
        state.set('test', 'foobar');
    }
});

var AttachingViewThree = AttachingViewOne.extend({
    el: '#slot_4_2'
});

var AttachingViewFour = AttachingViewTwo.extend({
    el: '#slot_4_3'
});

var LayoutView = spf.Layout.extend({
    el: '#layout_1',
    initialize: function() {
        this.$el.append('<div id="custom">custom</div>');
    }
});

var TemplateLayoutView = spf.Layout.extend({
    layout: function() {
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

var CustomRouter = spf.Router.extend({

    initialize: function() {
        // listen for state changes
        state.on('change:param1',this.updateViewRoute, this);
        state.on('change:param2',this.updateViewRoute, this);
    },

    routes: {
        "custom":                   "noaction",
        "custom/action1/:param1":   "action1",
        "custom/action2/:param2":   "action2"
    },
    
    noaction: function() {
        // update parameters
        state.unset('action');
        // update view - tight coupling required
        state.set({ view: 'custom' });
    },
    
    action1: function(param) {
        // update parameters
        state.setSerialized('param1', param);
        state.set({ action: 'action1' });
        // update view - tight coupling required
        state.set({ view: 'custom' });
    },
    
    action2: function(param) {
        // update parameters
        state.setSerialized('param2', param);
        state.set({ action: 'action2' });
        // update view - tight coupling required
        state.set({ view: 'custom' });
    },
    
    getRoute: function() {
        var action = state.get('action'),
            param1 = state.get('param1'),
            param2 = state.get('param2');
        return ('custom' + (action ? '/' + action : '') + 
            ((action == 'action1' && param1) ? '/' + param1 :
                (action == 'action2' && param2) ? '/' + param2 :
                ''));
    }

});