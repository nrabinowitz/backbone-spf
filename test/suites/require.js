var t = casper.test,
    baseUrl = casper.baseUrl;

casper.start();

casper
    .describe("Require > Simple View Layout")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: 'require/layoutview'
            }
        }).start();
    })
    .then(function() {
        t.assertEval(function() { return spf.app.currentView.name == 'Required Layout' },
            'The correct view class was used');
        t.assertVisible('#layout_1',
            'Layout 1 is visible');
        t.assertVisible('div#custom',
            'Custom div (appended by view) is visible');
    });

casper
    .describe("Require > Layout with slots")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_1',
                    slots: {
                        '#slot_1_1': 'require/view1',
                        '#slot_1_2': 'require/view2'
                    }
                },
                bar: { 
                    layout: '#layout_2',
                    slots: {
                        '#slot_2_1': 'require/view1',
                        '#slot_2_2': 'require/view2'
                    }
                }
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('#layout_1',
            'Layout 1 is visible');
        t.assertText('#slot_1_1 h2', 'ViewOne',
            'ViewOne slot initialized');
        t.assertText('#slot_1_2 h2', 'ViewTwo',
            'ViewTwo slot initialized');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertVisible('#layout_2',
            'Layout 2 is visible');
        t.assertText('#slot_2_1 h2', 'ViewOne',
            'ViewOne slot initialized');
        t.assertText('#slot_2_2 h2', 'ViewTwo',
            'ViewTwo slot initialized');
    });
    
casper
    .describe("Require > Global views")
    .setup('#foo', function() {
        spf.configure({
            globalViews: ['require/globaltest1'],
            views: {
                'foo': '#layout_1'
            }
        }).start();
    })
    .then(function() {
        t.assertEvalEquals(function() { return spf.app.globals.length }, 1,
            'Globals were initialized');
        t.assertText('#test1', 'GlobalTest1',
            'GlobalTest1 was initialized');
    });
    
casper
    .describe("Require > Nested Slots in template-based views")
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
                                'div.slot1' : 'require/view1'
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
    });
    
casper.run(function() {
    t.done();
});