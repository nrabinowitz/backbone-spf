Backbone-SPF
============

Backbone-SPF is a lightweight framework to help build single-page apps with Backbone.js, using a declarative configuration to define full-screen layouts with slots that contain Backbone views.

    spf.init({
        globals: [
            // views you want to initialize for all screens
        ],
        screen_one: {
            layout: MyLayout,
            slots: {
                slot_one: MyViewOne,
                slot_two: MyViewTwo
            },
            router: ScreenOneRouter
        },
        screen_two: {
            view: MyScreenView,
            router: ScreenTwoRouter
        },
        screen_three: MyScreenThreeView
    });