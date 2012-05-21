var t = casper.test,
    baseUrl = casper.baseUrl;

casper.start();

var viewId1, viewId2;

casper
    .describe("Slot refresh > refreshOn")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_2',
                    refreshOn: 'change:param1',
                    slots: {
                        '#slot_2_1': ViewOne,
                        '#slot_2_2': ViewTwo
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo');
        t.assertText('#slot_2_1 h2', 'ViewOne',
            'ViewOne slot rendered');
        t.assertText('#slot_2_2 h2', 'ViewTwo',
            'ViewTwo slot rendered');
        viewId1 = this.fetchText('#slot_2_1 span');
        viewId2 = this.fetchText('#slot_2_2 span');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param1: true }) });
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo');
        var viewId1_ = this.fetchText('#slot_2_1 span');
        var viewId2_ = this.fetchText('#slot_2_2 span');
        t.assert(viewId1_ !== viewId1,
            'ViewOne has been refreshed');
        t.assert(viewId2_ !== viewId2,
            'ViewTwo has been refreshed');
    });
    
casper
    .describe("Slot refresh > multiple refreshOn")
    .setup('#foo/1/1', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_2',
                    router: 'foo/:param1/:param2',
                    refreshOn: ['change:param1', 'change:param2'],
                    slots: {
                        '#slot_2_1': ViewOne,
                        '#slot_2_2': ViewTwo
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo/1/1');
        t.assertText('#slot_2_1 h2', 'ViewOne',
            'ViewOne slot rendered');
        t.assertText('#slot_2_2 h2', 'ViewTwo',
            'ViewTwo slot rendered');
        viewId1 = this.fetchText('#slot_2_1 span');
        viewId2 = this.fetchText('#slot_2_2 span');
    })
    .thenOpen(baseUrl + '#foo/1/2')
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo/1/2');
        var viewId1_ = this.fetchText('#slot_2_1 span');
        var viewId2_ = this.fetchText('#slot_2_2 span');
        t.assert(viewId1_ !== viewId1,
            'ViewOne has been refreshed');
        t.assert(viewId2_ !== viewId2,
            'ViewTwo has been refreshed');
        viewId1 = viewId1_;
        viewId2 = viewId2_;
    })
    .thenOpen(baseUrl + '#foo/2/2')
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo/2/2');
        var viewId1_ = this.fetchText('#slot_2_1 span');
        var viewId2_ = this.fetchText('#slot_2_2 span');
        t.assert(viewId1_ !== viewId1,
            'ViewOne has been refreshed');
        t.assert(viewId2_ !== viewId2,
            'ViewTwo has been refreshed');
    });
    
casper
    .describe("Slot refresh > event unbinding")
    .setup('#foo/1', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_2',
                    refreshOn: 'change:param1',
                    router: 'foo/:param1',
                    slots: {
                        '#slot_2_1': ViewOne
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo/1');
        t.assertText('#slot_2_1 h2', 'ViewOne',
            'ViewOne slot rendered');
        viewId1 = this.fetchText('#slot_2_1 span');
    })
    .then(function() {
        this.click('#slot_2_1 h2');
        t.assertEvalEquals(function() { return window._counter }, 1,
            'Counter incrementing on click');
    })
    .thenOpen(baseUrl + '#foo/2')
    .then(function() {
        t.assertAtRoute('#layout_2', 'foo', 'foo/2');
        var viewId1_ = this.fetchText('#slot_2_1 span');
        t.assert(viewId1_ !== viewId1,
            'ViewOne has been refreshed');
        this.click('#slot_2_1 h2');
        t.assertEvalEquals(function() { return window._counter }, 2,
            'Counter has only been incremented once');
    });
    
casper
    .describe("Slot refresh > Element removal")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_1',
                    slots: {
                        '#slot_1_1': ViewOne,
                        '#slot_1_2': AttachingViewOne,
                        '#slot_1_3': AttachingViewTwo
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
        t.assertText('#slot_1_1 h2', 'ViewOne',
            'ViewOne slot rendered');
        t.assertExists('#slot_1_1 div.view_one',
            'ViewOne created a div element');
        t.assertText('#slot_1_2 h2', 'AttachingView',
            'AttachingViewOne slot rendered');
        t.assertDoesNotExist('#slot_1_2 div',
            'AttachingViewOne used the slot element');
        t.assertDoesNotExist('#slot_1_3 div',
            'AttachingViewTwo used the slot element');
        t.assertExists('#slot_1_3 span',
            'AttachingViewTwo did not replace the DOM');
        try {
            this.click('#slot_1_3 span');
        } catch(e) {
            t.fail('Failed on click: ' + e)
        }
        t.assertState('test', 'foobar',
            'AttachingViewTwo handled slot event');
    })
    .then(function() {
        this.evaluate(function() { spf.app.currentView.clearSlots() });
        t.assertExists('#slot_1_1',
            'Slot 1 still there');
        t.assertExists('#slot_1_2',
            'Slot 2 still there');
        t.assertEvalEquals(function() { return $('#slot_1_1').html() }, '',
            'Slot 1 is empty');
        t.assertEvalEquals(function() { return $('#slot_1_2').html() }, '',
            'Slot 2 is empty');
        t.assertExists('#slot_1_3 span',
            'Slot 3 still has its elements');
        this.evaluate(function() { spf.state.set('test', 'baz') });
        try {
            this.click('#slot_1_3 span');
        } catch(e) {
            t.fail('Failed on click: ' + e)
        }
        t.assertState('test', 'baz',
            'AttachingViewTwo was unbound from slot event');
    });

    
casper
    .describe("Slot refresh > Element removal, templated layout")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#template_3',
                    slots: {
                        '#slot_4_1': ViewOne,
                        '#slot_4_2': AttachingViewThree,
                        '#slot_4_3': AttachingViewFour
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_4', 'foo', 'foo');
        t.assertText('#slot_4_1 h2', 'ViewOne',
            'ViewOne slot rendered');
        t.assertExists('#slot_4_1 div.view_one',
            'ViewOne created a div element');
        t.assertText('#slot_4_2 h2', 'AttachingView',
            'AttachingViewThree slot rendered');
        t.assertDoesNotExist('#slot_4_2 div',
            'AttachingViewThree used the slot element');
        t.assertDoesNotExist('#slot_4_3 div',
            'AttachingViewFour used the slot element');
        t.assertExists('#slot_4_3 span',
            'AttachingViewFour did not replace the DOM');
        try {
            this.click('#slot_4_3 span');
        } catch(e) {
            t.fail('Failed on click: ' + e)
        }
        t.assertState('test', 'foobar',
            'AttachingViewFour handled slot event');
    })
    .then(function() {
        this.evaluate(function() { spf.app.currentView.clearSlots() });
        t.assertExists('#slot_4_1',
            'Slot 1 still there');
        t.assertExists('#slot_4_2',
            'Slot 2 still there');
        t.assertEvalEquals(function() { return $('#slot_4_1').html() }, '',
            'Slot 1 is empty');
        t.assertEvalEquals(function() { return $('#slot_4_2').html() }, '',
            'Slot 2 is empty');
        t.assertExists('#slot_4_3 span',
            'Slot 3 still has its elements');
        this.evaluate(function() { spf.state.set('test', 'baz') });
        try {
            this.click('#slot_4_3 span');
        } catch(e) {
            t.fail('Failed on click: ' + e)
        }
        t.assertState('test', 'baz',
            'AttachingViewFour was unbound from slot event');
    });    
    
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
    
casper.run(function() {
    t.done();
});