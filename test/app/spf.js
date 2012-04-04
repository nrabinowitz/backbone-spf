/**
 * @namespace
 * The spf namespace includes all Backbone-SPF functionality.
 * Get it in your app by extending your namespace with this one.
 */
(function(Backbone, window) {
    var spf = window.spf = {},
        // default application settings
        config = spf.config = {
            appElement: 'body',
            views: {},
            
        },
        ensureArray = function(a) {
            return !a ? [] : _.isArray(a) ? a : [a]
        },
        identity = _.identity,
        State, state,
        View, Layout, AppView,
        Router, StateRouter, AppRouter,
        viewCache = {},
        routerCache = {};
        
    // --------------------------------
    // Application State
    // --------------------------------
    
    /**
     * @name spf.State
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
     * @name spf.View
     * @class
     * Extend the base view class with some useful features
     */
    View = spf.View = Backbone.View.extend({
        // bind/unbind state listeners
        bindState: function(event, handler, context) {
            // create handler array if necessary
            if (!this._stateHandlers) {
                this._stateHandlers = [];
            }
            state.on(event, handler, context);
            this._stateHandlers.push({ event: event, handler: handler, context: context });
        },
        unbindState: function() {
            (this._stateHandlers || []).forEach(function(h) {
                state.off(h.event, h.handler, h.context);
            });
        },
        // basic clear support
        clear: function() {
            var view = this;
            view.$el.empty();
            view.unbindState();
            view.undelegateEvents();
            return view;
        }
    });
    
    /**
     * @name spf.Layout
     * @class
     * Layout for a full-screen view. In general, Layouts should be relatively static,
     * with UI controls and complex view logic handled in the slot views.
     * @extends spf.View
     */
    Layout = spf.Layout = View.extend({
        
        initialize: function() {
            var view = this,
                refreshOn = view.refreshOn;
            // init slots
            view.slots = {};
            // bind state for refresh events
            if (refreshOn) {
                ensureArray(refreshOn).forEach(function(event) {
                    view.bindState(event, view.refresh, view);
                });
            }
        },
        
        /**
         * Clear this layout
         */
        clear: function() {
            var view = this;
            view.clearSlots();
            view.unbindResize();
            View.prototype.clear.call(view);
        },
        
        /**
         * Clear slot views
         */
        clearSlots: function() {
            _(this.slots).each(function(slot) {
                slot.clear();
            });
            this.slots = {};
        },
        
        /**
         * Refresh all slots
         */
        refresh: function() {
            this.clearSlots();
            this.updateSlots();
        },
        
        /**
         * Render view
         */
        render: function() {
            this.layout();
            this.bindResize();
            this.updateSlots();
            return this;
        },
        
        /**
         * Instantiate new slot views. If there's a DOM element in the
         * layout with the same name as the slot key, the slot view
         * will be appended to that element.
         */
        updateSlots: function() {
            var view = this;
            _(view.slotClasses).each(function(cls, key) {
                // instatiate slots
                var slot = view.slots[key] = new cls({ 
                        parent: view
                    }),
                    el = view.$(key)[0];
                slot.render();
                if (el) slot.$el.appendTo(el);
            });
        },
        
        /**
         * Bind layout() to window resize
         * @param {Function} [cb=layout]   Callback function (defaults to this.layout)
         */
        bindResize: function(cb) {
            // create handler array if necessary
            if (!this._resizeHandlers) {
                this._resizeHandlers = [];
            }
            var view = this,
                callback = cb || function() { view.layout() },
                handler = function() {
                    callback();
                };
            view._resizeHandlers.push(handler);
            $(window).resize(handler);
        },
        
        /**
         * Unbind all of this views handlers on window.resize
         */
        unbindResize: function() {
            (this._resizeHandlers || []).forEach(function(h) {
                $(window).unbind('resize', h);
            });
        },
        
        /**
         * Function to handle DOM layout (e.g. sizing elements to fit window).
         * Defaults to a no-op; override in subclasses
         */
        layout: $.noop
    
    });
    
    /**
     * @name spf.AppView
     * @class
     * Primary view for the application
     */
    AppView = spf.AppView = Backbone.View.extend({
        
        initialize: function() {
            var app = this;
            app.globals = [];
            // initialize global views
            (config.globalViews || []).forEach(function(cls) {
                app.globals.push(new cls({ parent: app }));
            });
            // listen for state changes
            state.bind('change:view', app.updateView, app);
        },
        
        dropView: function(key) {
            var view = viewCache[key];
            if (view) {
                view.clear().remove();
                delete viewCache[key];
            }
        },
        
        // update the top-level layout
        updateView: function() {
            var app = this,
                viewKey = state.get('view'),
                oldKey = app.viewKey,
                oldView = app.currentView,
                viewKeys, viewConfig,
                view, viewClass, fromRight;
            if (viewKey && viewKey !== oldKey) {
                // look in cache
                view = viewCache[viewKey];
                if (!view) {
                    // no cache - get view class from config and instantiate
                    viewConfig = config.views[viewKey];
                    viewClass = viewConfig && viewConfig.layout;
                    if (viewClass) {
                        // instatiate and add to DOM
                        view = app.currentView = viewCache[viewKey] = new viewClass({ parent: app });
                        view.render().$el.appendTo(app.el);
                    } else {
                        // this should only happen due to a coding error
                        throw "No view class found for view " + viewKey;
                    }
                }
                app.viewKey = viewKey;
                // work out left/right
                viewKeys = _(config.views).keys();
                fromRight = oldKey ? 
                    viewKeys.indexOf(oldKey) < viewKeys.indexOf(viewKey) :
                    true;
                // close old view
                if (oldView) app.close(oldView, fromRight);
                // open new view
                app.open(view, fromRight);
            }
        },
        
        open: function(view, fromRight) {
            view.$el.show();
        },
        
        close: function(view, fromRight) {
            view.$el.hide();
        }
    });
    
    // --------------------------------
    // Router classes
    // --------------------------------
    
    /**
     * @name spf.Router
     * @class
     * Core router
     */
    Router = spf.Router = Backbone.Router.extend({
    
        /**
         * Get the route string for the current route
         */
        getRoute: function() {
            // (override in subclasses)
            return '';
        },
        
        /**
         * Update the url based on the current state
         */
        updateRoute: function() {
            this.navigate(this.getRoute());
        },
        
        /** 
         * Update the url if this router is responsible for the current view
         */
        updateViewRoute: function() {
            if (this.viewKey && this.viewKey == state.get('view')) {
                this.updateRoute();
            }
        }
        
    });
    
    /**
     * @name spf.StateRouter
     * @class
     * Router class that supports a simple syntax for routes that update state
     */
    StateRouter = spf.StateRouter = Router.extend({
        
        initialize: function() {
            var router = this,
                viewKey = router.viewKey,
                routeStrings = router.routeStrings,
                stateParams = [],
                // look for routes in options, or default to view key
                routeEntries =  router.routeEntries = ensureArray(routeStrings || viewKey)
                        .map(function(r) {
                            // get state variables
                            var params = (r.match(/:\w+/g) || [])
                                .map(function(s) { return s.substr(1) });
                            // add to listener list
                            stateParams = _.union(stateParams, params);
                            // return entry object
                            return { route: r, params: params }
                        });
            // set up routes
            _(routeEntries).each(function(e) {
                var r = e.route,
                    params = e.params;
                // add route
                router.route(r, r, function() {
                    var args = Array.prototype.slice.call(arguments);
                    args = params.reduce(function(agg, p, i) {
                        agg[p] = args[i];
                        return agg;
                    }, {});
                    // update state parameters
                    params.forEach(function(p) {
                        state.setSerialized(p, args[p]);
                    });
                    // update view
                    state.set({ view: viewKey });
                });
            });
            // listen for state changes
            stateParams.forEach(function(param) {
                state.on('change:' + param, router.updateViewRoute, router);
            });
        },
        
        getRoute: function() {
            // get the route with the most non-null state vars
            var route = _.sortBy(
                _(this.routeEntries)
                    .filter(function(e) {
                        var params = e.params,
                            i, val;
                        e.rendered = e.route;
                        // look for missing state vars, replacing on the way
                        for (i=0; i<params.length; i++) {
                            val = state.get(params[i]);
                            // missing, don't include
                            if (!val) return false;
                            // otherwise, update the route
                            e.rendered = e.rendered.replace(':' + params[i], val);
                        } 
                        return true;
                    }),
                function(e) {
                    return e.params.length
                }
            ).pop();
            return route && route.rendered;
        }
        
    });
    
    /**
     * @name spf.AppRouter
     * @class
     * Primary router for the application
     */
    AppRouter = spf.AppRouter = Router.extend({
    
        initialize: function() {
            var router = this;
            // instantiate routers
            _(config.views).each(function(viewConfig, k) {
                routerCache[k] = new viewConfig.router();
            });
            // set up history to catch querystrings
            Backbone.history.getFragment = function() {
                var fragment = Backbone.History.prototype.getFragment.apply(this, arguments),
                    // intercept and get querystring
                    parts = fragment.split('?'),
                    qs = parts[1];
                if (qs) {
                    router.parseQS(qs);
                }
                return parts[0];
            };
            // listen for state changes
            state.on('change:view', this.updateRoute, this);
        },
        
        // get the router for the current top view
        getRouter: function() {
            var viewKey = state.get('view'),
                router = routerCache[viewKey];
            if (!router) throw "No router found for view " + viewKey;
            return router;
        },
        
        getRoute: function() {
            // delegate
            return this.getRouter().getRoute();
        },
        
        navigate: function(route, options) {
            // delegate
            return this.getRouter().navigate(route, options);
        },
        
        // set any global state variables from the querystring
        parseQS: function(qs) {
            qs.split('&').forEach(function(pair) {
                var kv = pair.split('='),
                    val = kv[1] ? decodeURIComponent(kv[1]) : null;
                if (kv.length > 1) {
                    state.setSerialized(kv[0], val);
                }
            });
        },
        
        // encode a querystring from state parameters
        getQS: function() {
            var qs = (this.qsParams || []).map(function(key) {
                    var value = state.get(key),
                        fragment = '';
                    if (value) {
                        fragment = key + '=' + encodeURI(state.serialize(key, value));
                    }
                    return fragment;
                }).filter(_.identity).join('&');
            return qs ? '?' + qs : '';
        },
        
        // the full link, with querystring in state
        getPermalink: function() {
            var href = window.location.href.split('?')[0];
            return href + this.getQS();
        }

    });
    
    // --------------------------------
    // Module methods
    // --------------------------------

    /**
     * @name spf.config
     * Configure the application
     * @param {Object} options      Config object
     */
    spf.configure = function(options) {
        _.extend(config, options);
        // support shortcuts for static view layouts and state-based routers
        _(config.views).each(function(viewConfig, k) {
            // whole config is a view or a string - set up object
            if (viewConfig.prototype instanceof Backbone.View || _.isString(viewConfig))
                viewConfig = config.views[k] = { layout: viewConfig };
            // layout is a string - create view with factory
            if (_.isString(viewConfig.layout))
                viewConfig.layout = Layout.extend({ 
                    el: viewConfig.layout 
                });
            // set slots and refresh
            viewConfig.layout = viewConfig.layout.extend({ 
                slotClasses: viewConfig.layout.prototype.slotClasses || viewConfig.slots,
                refreshOn: viewConfig.refreshOn
            });
            // no router - default to single route based on key
            if (!viewConfig.router)
                viewConfig.router = k;
            // router is a string or an array - create router with factory
            if (_.isString(viewConfig.router) || _.isArray(viewConfig.router))
                viewConfig.router = StateRouter.extend({ 
                    viewKey: k, 
                    routeStrings: viewConfig.router
                });
        });
        return spf;
    };
    
    /**
     * @name spf.start
     * Start the application. Instantiates core objects and starts Backbone.history.
     */
    spf.start = function() {
        spf.router = new AppRouter();
        spf.app = new AppView({
            el: config.appElement
        });
        Backbone.history.start();
    }
    
    return spf;
})(Backbone, window);