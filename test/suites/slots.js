var t = casper.test,
    baseUrl = casper.baseUrl;

casper.start();
    
casper
    .describe("Slots in template-based views")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#template_2',
                    id: 'foo',
                    slots: {
                        'div.slot1': ViewOne
                    }
                },
                bar: {
                    layout: '#template_2',
                    id: 'bar',
                    slots: {
                        'div.slot1': '#template_1'
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#foo', 'foo', 'foo');
        t.assertText('#foo h2', 'Layout Template Test',
            'View foo is using the correct template');
        t.assertText('#foo div.slot1 h2', 'ViewOne',
            'ViewOne slot initialized');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertAtRoute('#bar', 'bar', 'bar');
        t.assertText('#bar h2', 'Layout Template Test',
            'View bar is using the correct template');
        t.assertText('#bar div.slot1 div.template', 'Template Test',
            'Templated slot initialized');
    });
   
casper
    .describe("Nested Slots in template-based views")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#template_2',
                    id: 'foo',
                    slots: {
                        'div.slot1': {
                            layout: '#template_2',
                            slots: {
                                'div.slot1' : ViewOne
                            }
                        }
                    }
                },
                bar: {
                    layout: '#template_2',
                    id: 'bar',
                    slots: {
                        'div.slot1': {
                            layout: '#template_2',
                            id: 'bar1',
                            slots: {
                                'div.slot1' : {
                                    id: 'bar2',
                                    className: 'baz',
                                    layout: '#template_2',
                                    slots: {
                                        'div.slot1' : {
                                            layout: '#template_1',
                                            id: 'bar3'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#foo', 'foo', 'foo');
        t.assertText('#foo h2', 'Layout Template Test',
            'View foo is using the correct template');
        t.assertText('#foo div.slot1 div > h2', 'Layout Template Test',
            'Slot using the right template');
        t.assertText('#foo div.slot1 div.slot1 h2', 'ViewOne',
            'Nested slot using the ViewOne view');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertAtRoute('#bar', 'bar', 'bar');
        t.assertVisible('#bar #bar1',
            'Slot bar1 visible with correct id');
        t.assertVisible('#bar #bar1 #bar2',
            'Slot bar2 visible with correct id');
        t.assertVisible('#bar #bar1 #bar2 #bar3',
            'Slot bar2 visible with correct id');
        t.assertText('#bar #bar1 #bar2 #bar3 div.template', 'Template Test',
            'Slot bar3 using the right template');
    })
    .then(function() {
        t.assertExists('#bar.top.depth0', 
            'Top-level CSS set correctly');
        t.assertExists('#bar #bar1.depth1',
            'Slot bar1 CSS set correctly');
        t.assertVisible('#bar #bar1 #bar2.baz.depth2',
            'Slot bar2 CSS set correctly');
    })
    .then(function() {
        this.evaluate(function() { spf.app.currentView.slots['div.slot1'].clear() });
        t.assertVisible('div.slot1',
            'Slot 1 still there');
        t.assertEvalEquals(function() { return $('#bar div.slot1').html() }, '',
            'Slot 1 is empty');
    });

casper
    .describe("Multiple views per slot")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#layout_1',
                    id: 'foo',
                    slots: {
                        '#slot_1_1': [
                            ViewOne, 
                            '#template_1', 
                            {
                                id: 'bar2',
                                className: 'baz',
                                layout: '#template_2'
                            }
                        ]
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
        t.assertText('#slot_1_1 .view_one h2', 'ViewOne',
            'ViewOne slot initialized');
        t.assertText('#slot_1_1 .template_1 div.template', 'Template Test',
            'template_1 slot initialized');
        t.assertVisible('#slot_1_1 #bar2.baz.template_2',
            'bar2 slot initialized with attributes');
    });
    
casper
    .describe("Views in 'this' slot")
    .setup('#foo', function() {
        spf.configure({
            views: {
                'foo': {
                    id: 'new_layout',
                    slots: {
                        'this': [ViewOne, '#template_1']
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#new_layout', 'foo', 'foo');
        t.assertText('#new_layout .view_one h2', 'ViewOne',
            'ViewOne slot initialized');
        t.assertText('#new_layout .template_1 div.template', 'Template Test',
            'template_1 slot initialized');
    });
    
casper.run(function() {
    t.done();
});