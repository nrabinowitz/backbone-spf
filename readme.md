Backbone-SPF
============

Backbone-SPF is a lightweight framework to help build single-page apps with Backbone.js, using a declarative configuration to define full-screen layouts with slots that contain Backbone views.

    spf.init({
        globalViews: [
            // views you want to initialize for all screens at app initialization
        ],
        views: {
            view_one: {
                layout: MyLayout, // layout view with slots
                refreshOn: 'change:modelid', // state event requiring slot refresh
                slots: {
                    '#slot_one': MySlotViewOne,
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
    });
    
 * Projects can extend spf to pull the functionality into their own namespace
 * It's easy to subclass the library's classes to add or override functionality
 * Full-screen layout views are cached on creation. It's assumed that their content is already in the DOM.