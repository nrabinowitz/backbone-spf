/*!
 * Copyright (c) 2011, Nick Rabinowitz / Google Ancient Places Project
 * Licensed under the BSD License (see LICENSE.txt)
 */

/**
 * @namespace
 * The spf namespace includes all Backbone-SPF functionality.
 * Get it in your app by extending your namespace with this one.
 */
(function(Backbone, window) {
    var spf = window.spf = {},
        hasRequire = typeof define == 'function' && define.amd,
        // default application settings
        config = spf.config = {
            appElement: 'body',
            views: {},
            cacheViews: false
        },
        ensureArray = function(a) {
            return a===undefined ? [] : _.isArray(a) ? a : [a]
        },
        elementInDom = function(el) {
            while (el && (el = el.parentNode)) if (el === document) return true; 
            return false; 
        },
        identity = _.identity,
        addClasses = function() {
            return _(arguments).filter(identity).join(' ')
        },
        viewCache = {},
        routerCache = {},
        stateParams = {},
        BackboneView = Backbone.View,
        BackboneModel = Backbone.Model,
        State, state,
        View, Layout,
        Router, StateRouter;
        
    // --------------------------------
    // Application State
    // --------------------------------
    
    /**
     * @name spf.State
     * @class
     * Model to hold application state.
     */
    State = spf.State = BackboneModel.extend({
        // (de)serialization functions
        deserialize: function(key, value) {
            var f = stateParams[key] && stateParams[key].deserialize || identity;
            return f(value);
        },
        serialize: function(key, value) {
            var f = stateParams[key] && stateParams[key].serialize || identity;
            return f(value);
        },
        // set a serialized value
        setSerialized: function(key, value, options) {
            this.set(key, this.deserialize(key, value), options);
        },
        // get a serialized value
        getSerialized: function(key) {
            var val = this.get(key);
            return val !== undefined && this.serialize(key, val);
        },
        // override set() to deserialize if required
        set: function(key, value, options) {
            var state = this,
                attrs;
            // support both (key, value) and ({key:value})
            if (_.isObject(key)) {
                attrs = key;
                options = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }
            // try to deserialize any strings
            _(attrs).each(function(v, k) {
                if (_.isString(v)) attrs[k] = state.deserialize(k, v);
            });
            BackboneModel.prototype.set.call(state, attrs, options);
        }
    });
    
    // initialize singleton
    state = spf.state = new State();
    
    // --------------------------------
    // View classes
    // --------------------------------
    
    /**
     * @name spf.View
     * @class
     * Extend the base view class with some useful features
     */
    View = spf.View = BackboneView.extend({
    
        // deal with templates and flag whether the element exists in the DOM on initialization
        _ensureElement: function() {
            var view = this,
                templateSelector = 'script[type*="template"]',
                el = view.el,
                templateId,
                parent, parentEl;
            BackboneView.prototype._ensureElement.call(view);
            // handle reusable template content
            if (view.$el.is(templateSelector)) {
                view.template = view.$el.html();
                templateId = view.$el.attr('id'),
                    attrs = _.extend({}, {
                        'class': addClasses(view.className, templateId),
                        'id': view.id
                    }, view.attributes);
                view.setElement(view.make(view.tagName, attrs));
            } else if ((templateId = view.template) && $(templateId).is(templateSelector)) {
                view.className = addClasses(view.className, templateId);
                view.template = $(view.template).html();
            }
            // handle children of parents not yet in DOM
            if (!view.el 
                && el 
                && (parent = view.options.parent)
                && (parentEl = parent.el)
                && (el = $(el, parentEl)[0])) {
                view.setElement(el);
                view.inDom = true;
            } 
            // otherwise, check whether we're already in the DOM
            else view.inDom = elementInDom(view.el);
        },
        
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
            // empty, remove, or don't touch DOM
            if (view.inDom) {
                if (view.clearDom) view.$el.empty();
            }
            else view.remove();
            view.unbindState();
            view.undelegateEvents();
            return view;
        },
        
        // set to false in subclasses to leave the DOM alone
        clearDom: true,
        
        // passthrough by default
        ready: function(callback) {
            callback();
        },
        
        // decorator: function called only when the view is ready
        bindReady: function(callback) {
            var view = this,
                f = typeof callback == 'function' ? callback :
                    // otherwise, assume it's a method name on the view
                    _.bind(view[callback], view);
            return function() { view.ready(f); };
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
        
        clearDom: false,
        
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
            var view = this;
            if (view.template) view.$el.html(view.template);
            view.updateSlots();
            view.bindResize();
            return this;
        },
        
        /**
         * Instantiate new slot views. If there's a DOM element in the
         * layout with the same name as the slot key, the slot view
         * will be appended to that element.
         */
        updateSlots: function() {
            var view = this,
                slotCount = _.reduce(view.slotConfig, function(count, slotConfig) {
                    return count + ensureArray(slotConfig).length;
                }, 0),
                layoutAfter = _.after(slotCount, function() {
                    // appears to be necessary for some view refreshes
                    setTimeout(function() {
                        view.layout(); 
                    }, 0);
                });
            _(view.slotConfig).each(function(slotConfig, key) {
                var order = [];
                // handle arrays
                ensureArray(slotConfig).forEach(function(slotConfig, i) {
                    // process config
                    processViewConfig(slotConfig, view.depth+1, function(slotConfig) {
                        // instantiate slots
                        var slot = view.slots[key] = new slotConfig.layout({ 
                                parent: view
                            }),
                            $parent, $prev;
                        // render, optionally waiting for models to load
                        slot.ready(function() {
                            slot.render();
                            layoutAfter();
                        });
                        // add to DOM, dealing with async order issues
                        if (!slot.inDom) {
                            order[i] = slot.el;
                            $parent = key == 'this' ? view.$el : view.$(key);
                            var $prev = $parent
                                .children()
                                .filter(function() {
                                    return order.indexOf(this) < i
                                })
                                .last();
                            if ($prev[0]) slot.$el.insertAfter($prev); 
                            else $parent.prepend(slot.el);
                        }
                    });
                });
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
    spf.AppView = BackboneView.extend({
        
        initialize: function() {
            var app = this;
            app.globals = [];
            // initialize global views
            ensureArray(config.globalViews).forEach(function(globalView) {
                processViewConfig(globalView, -1, function(globalConfig) {
                    app.globals.push(new globalConfig.layout({ parent: app }));
                });
            });
            // listen for state changes
            state.bind('change:view', app.updateView, app);
        },
        
        dropView: function(key) {
            var view = viewCache[key];
            if (view) {
                view.clear();
                delete viewCache[key];
            }
        },
        
        // update the top-level layout
        updateView: function() {
            var app = this,
                viewKey = state.get('view'),
                oldKey = state.previous('view'),
                oldView = app.currentView,
                viewKeys, viewConfig,
                view, viewClass, fromRight;
            // callback
            function swapViews(view) {
                app.currentView = view;
                // work out left/right
                viewKeys = _(config.views).keys();
                fromRight = oldKey ? 
                    viewKeys.indexOf(oldKey) < viewKeys.indexOf(viewKey) :
                    true;
                // close old view
                if (oldView) app.close(oldView, fromRight, 
                    config.cacheViews ? $.noop : function() { oldView.clear() });
                // open new view
                app.open(view, fromRight);
            }
            if (viewKey !== undefined && viewKey !== oldKey) {
                // look in cache
                view = config.cacheViews && viewCache[viewKey];
                if (!view) {
                    // no cache - get view class from config and instantiate
                    processViewConfig(config.views[viewKey], 0, function(viewConfig) {
                        viewClass = viewConfig && viewConfig.layout;
                        if (viewClass) {
                            // instantiate and add to DOM
                            view = viewCache[viewKey] = new viewClass({ parent: app });
                            view.render();
                            if (!view.inDom) view.$el.appendTo(app.el);
                        } else {
                            // this should only happen due to a coding error
                            throw "No view class found for view " + viewKey;
                        }
                        swapViews(view);
                    });
                } else swapViews(view);
            }
        },
        
        open: function(view, fromRight) {
            view.$el.show();
        },
        
        close: function(view, fromRight, callback) {
            view.$el.hide();
            callback();
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
                    // null out missing params
                    _.difference(stateParams, params).forEach(function(p) {
                        state.unset(p);
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
    spf.AppRouter = Router.extend({
    
        initialize: function() {
            var router = this;
            router.cache = routerCache;
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
            var qs = _.keys(stateParams).map(function(key) {
                    var value = state.getSerialized(key),
                        fragment = '';
                    if (value) {
                        fragment = key + '=' + encodeURI(value);
                    }
                    return fragment;
                }).filter(identity).join('&');
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
    
    function ensureViewObject(viewConfig) {
        // whole config is a view or a string - set up object
        return (viewConfig.prototype instanceof BackboneView || _.isString(viewConfig)) ? 
            { layout: viewConfig } : viewConfig;
    }
    
    // recursively process a view configuration object
    function processViewConfig(viewConfig, depth, callback) {
        viewConfig = ensureViewObject(viewConfig);
        function checkRequire(f) {
            var layout = viewConfig.layout;
            // does this look like a require dependency?
            if (hasRequire 
                    && _.isString(layout) 
                    // string test could match some selectors, so allow explicit choices
                    && !viewConfig.noRequire
                    && (viewConfig.useRequire || layout.match(/^\w+$/) || layout.match(/\//)))
                require([layout], f);
            else f(layout);
        }
        checkRequire(function(layout) {
            var slots = viewConfig.slots,
                attrs = _.clone(viewConfig);
            // no layout - create empty layout
            if (!layout) layout = spf.Layout;
            // layout is a string - create view
            if (_.isString(layout))
                layout = spf.Layout.extend({ 
                    el: layout 
                });
            // allow manual slotConfig to override?
            if (!layout.prototype.slotConfig) {
                // set slots
                layout = layout.extend({ 
                    slotConfig: slots || {}
                });
            }
            // set any other settings, removing problematic keys
            _(['layout', 'slots', 'router']).each(function(k) { delete attrs[k] });
            // add CSS classes
            attrs.className = addClasses(
                layout.prototype.className || attrs.className,
                'depth' + depth, 
                !depth ? 'top' : ''
            );
            attrs.topLevel = !depth;
            attrs.depth = depth;
            viewConfig.layout = layout.extend(attrs);
            // send to callback
            callback(viewConfig);
        });
    }
    
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
            viewConfig = config.views[k] = ensureViewObject(viewConfig);
            // no router - default to single route based on key
            if (!viewConfig.router)
                viewConfig.router = k;
            // router is a string or an array - create router with factory
            if (_.isString(viewConfig.router) || _.isArray(viewConfig.router))
                viewConfig.router = spf.StateRouter.extend({ 
                    viewKey: k, 
                    routeStrings: viewConfig.router
                });
            // XXX: Handle require'd routers here?
        });
        return spf;
    };
    
    /**
     * @name spf.addParameter
     * Define a state parameter. While any state setting can simply be .set()
     * on the state model, defining a setting as a parameter allows it to be serialized 
     * and deserialized from the querystring. This is most appropriate for application 
     * state settings that would not otherwise be handled in a route.
     *
     * @param {String} name         Name of the parameter. This will be used as the
     *                              attribute in the state model and as the querystring
     *                              parameter name.
     * @param {Object} [options]    Optional settings:
     * @param {Function} [options.deserialize]  Function to deserialize value from a string
     * @param {Function} [options.serialize]    Function to serialize value to a string
     */
    spf.addParameter = function(name, options) {
        stateParams[name] = _.extend({
            serialize: identity,
            deserialize: identity
        }, options);
    };
    
    /**
     * @name spf.resetState
     * Reset the application state. Because the state object is initialized when the library
     * is loaded, if you want to extend the State class, you'll need to set spf.State to your 
     * new class, then call this function to reset.
     */
    spf.resetState = function() {
        state = spf.state = new spf.State();
    };
    
    /**
     * @name spf.start
     * Start the application. Instantiates core objects and starts Backbone.history.
     * @param {object} [options]    Options to pass to Backbone.history.start()
     */
    spf.start = function(options) {
        // initialize the core objects
        spf.router = new spf.AppRouter();
        spf.app = new spf.AppView({
            el: config.appElement
        });
        // start the router machinery
        Backbone.history.start(options);
    }
    
    return spf;
})(Backbone, window);