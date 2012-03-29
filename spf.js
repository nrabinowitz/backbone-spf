/**
 * @namespace
 * The spf namespace includes all Backbone-SPF functionality.
 * Get it in your app by extending your namespace with this one.
 */
var spf = (function(Backbone, window) {
    var spf = {},
        // default application settings
        config = spf.config = {
            appElement: 'body',
            screens: {}
        },
        screens,
        identity = _.identity,
        State, state,
        View, AppView, 
        Router, AppRouter;
        
    // --------------------------------
    // Application State
    // --------------------------------
    
    /**
     * @class
     * Model to hold application state.
     */
    State = spf.State = Backbone.Model.extend({
        initialize: function() {
            this.params = {};
        },
        // (de)serialization functions
        deserialize: function(key, value) {
            var params = this.params,
                f = params[key] && params[key].deserialize || identity;
            return f(value);
        },
        serialize: function(key, value) {
            var params = this.params,
                f = params[key] && params[key].serialize || identity;
            return f(value);
        },
        // convenience function to set a serialized value
        setSerialized: function(key, value) {
            o = {};
            o[key] = this.deserialize(key, value);
            this.set(o);
        },
        // add de/serializable state parameters
        addParam: function(key, deserialize, serialize) {
            this.params[key] = {
                deserialize: deserialize || identity,
                serialize: serialize || identity
            }
        }
    });
    
    // initialize the singleton
    state = spf.state = new State();
    
    // --------------------------------
    // View classes
    // --------------------------------
    
    /**
     * @class
     * Extend the base view class with some useful features
     */
    View = Backbone.View.extend({
        // bind/unbind state listeners
        bindState: function(event, handler, context) {
            // create handler array if necessary
            if (!this._stateHandlers) {
                this._stateHandlers = [];
            }
            state.on(event, handler, context);
            this._stateHandlers.push({ event: event, handler: handler });
        },
        unbindState: function() {
            (this._stateHandlers || []).forEach(function(h) {
                state.off(h.event, h.handler);
            });
        },
        // basic clear support
        clear: function() {
            var view = this;
            view.$el.empty();
            view.unbindState();
            view.unbindResize();
            view.undelegateEvents();
            return view;
        },
        // bind layout() to window resize
        bindResize: function(f) {
            // create handler array if necessary
            if (!this._resizeHandlers) {
                this._resizeHandlers = [];
            }
            var view = this,
                callback = f || function() { view.layout() },
                handler = function() {
                    callback();
                };
            view._resizeHandlers.push(handler);
            $(window).resize(handler);
        },
        unbindResize: function() {
            (this._resizeHandlers || []).forEach(function(h) {
                $(window).unbind('resize', h);
            });
        },
        // override in subclasses
        layout: $.noop,
        // common pattern support
        bindingLayout: function() {
            this.layout();
            this.bindResize();
        }
    });
    
    /**
     * @class
     * Primary view for the application
     */
    AppView = spf.AppView = Backbone.View.extend({
        
        initialize: function() {
            // listen for state changes
            state.bind('change:screen', this.updateScreen, this);
        },
        
        getScreenClass: function(screen) {
            var screenConfig = screens[screen];
            return screenConfig && (
                // is this a view?
                (screenConfig.render && screenConfig.delegateEvents) ? screenConfig :
                    // nope, a configuration object
                    screenConfig.layout || screenConfig.view
            );
        },
        
        // update the top-level screen
        updateScreen: function() {
            var app = this,
                screenKey = state.get('screen'),
                screenKeys = _(screens).keys(),
                screenClass = getScreenClass(screen),
                oldKey = app.screenKey,
                oldScreen = app.screenView,
                screenView, fromRight;
            if (screenClass && screenClass !== oldClass) {
                // instantiate new screen - XXX: get from cache?
                screenView = app.screenView = new screenClass({ parent: app });
                app.screenKey = screenKey;
                // work out left/right
                fromRight = oldKey ? 
                    screenKeys.indexOf(oldKey) < screenKeys.indexOf(screenKey) :
                    true;
                // close old screen
                if (oldScreen) app.close(oldScreen, fromRight);
                // open new screen
                app.open(screenView, fromRight);
            }
        },
        
        openScreen: function(view, fromRight) {
            this.$el.append(view.el);
            view.$el.show(
                'slide', 
                {direction: (fromRight ? 'right' : 'left') }, 
                500
            );
        },
        
        closeScreen: function(view, fromRight) {
            view.$el.hide(
                'slide', 
                { direction: (fromRight ? 'left' : 'right') }, 
                500,
                function() { view.clear().remove() }
            );
        }
    });
    
    // XXX: Add Router and AppRouter


    spf.createApp = function(options) {
        _extend(config, options);
        screens = config.screens;
        return spf;
    };
    
    spf.start = function() {
        spf.router = new AppRouter();
        spf.app = new AppView({
            el: config.appElement
        });
        Backbone.history.start();
    }
    
    return spf;
})(Backbone, window);