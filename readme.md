Backbone-SPF
============

Backbone-SPF is a lightweight framework to help build single-page apps with Backbone.js, using a declarative configuration to define full-screen layouts with slots that contain Backbone views.

    spf.configure({
        globalViews: [
            // views you want to initialize for all screens at app initialization
        ],
        views: {
            view_one: {
                layout: 'views/MyView', // layout view with slots, loaded with require.js
                refreshOn: 'change:modelid', // state event requiring slot refresh
                slots: {
                    '#slot_one': MySlotViewOne, // slots are keyed by selector in the layout
                    '#slot_two': MySlotViewTwo
                },
                router: 'view_one/:modelid' // shorthand for state-based router
            },
            view_two: {
                layout: MyView, // one view for the whole page
                router: ViewTwoRouter // Router class
            },
            view_three: MyViewThree, // one view, no sub-routes
            view_four: {
                layout: '#layout_four', // shorthand for Layout.extend({ el: ... })
                router: ['view_four', 'view_four/:modelid'], // shorthand for state-based router
                slots: { ... }
            },
            view_five: '#layout_five' // shorthand for Layout.extend({ el: ... })
        }
    }).start(); // initializes app and routers, starts Backbone.history
    
 * Projects can extend spf to pull the functionality into their own namespace
 * It's easy to subclass the library's classes to add or override functionality
 * Full-screen layout views are cached on creation if desired
 * Supports nested layouts
 * Supports layouts and views loaded with require.js
 
Backbone-SPF was built to support [GapVis](/nrabinowitz/gapvis), part of the [Google Ancient Places project](http://googleancientplaces.wordpress.com/). Comments and questions welcomed at nick (at) nickrabinowitz (dot) com.