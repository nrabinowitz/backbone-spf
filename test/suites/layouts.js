var t = casper.test,
    baseUrl = casper.baseUrl;

casper.start();

casper
    .describe("Simple String Layout")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: '#layout_1',
                bar: '#layout_2'
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('#layout_1',
            'Layout 1 is visible');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertVisible('#layout_2',
            'Layout 2 is visible');
    });
    
casper
    .describe("String layout with objects")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { layout: '#layout_1' },
                bar: { layout: '#layout_2' }
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('#layout_1',
            'Layout 1 is visible');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertVisible('#layout_2',
            'Layout 2 is visible');
    });

casper
    .describe("String layout with slots")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: { 
                    layout: '#layout_1',
                    slots: {
                        '#slot_1_1': ViewOne,
                        '#slot_1_2': ViewTwo
                    }
                },
                bar: { 
                    layout: '#layout_2',
                    slots: {
                        '#slot_2_1': ViewOne,
                        '#slot_2_2': ViewTwo
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
    .describe("Simple View Layout")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: LayoutView
            }
        }).start();
    })
    .then(function() {
        t.assertEval(function() { return spf.app.currentView instanceof LayoutView },
            'The correct view class was used');
        t.assertVisible('#layout_1',
            'Layout 1 is visible');
        t.assertVisible('div#custom',
            'Custom div (appended by view) is visible');
    });

casper
    .describe("Global views")
    .setup('#foo', function() {
        spf.configure({
            globalViews: [GlobalTest1, GlobalTest2],
            views: {
                'foo': '#layout_1'
            }
        }).start();
    })
    .then(function() {
        t.assertEvalEquals(function() { return spf.app.globals.length }, 2,
            'Globals were initialized');
        t.assertText('#test1', 'GlobalTest1',
            'GlobalTest1 was initialized');
        t.assertText('#test2', 'GlobalTest2',
            'GlobalTest2 was initialized');
    });

casper
    .describe("Template-based view")
    .setup('#foo', function() {
        spf.configure({
            views: {
                'foo': '#template_1'
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('div div.template',
            'Template 1 is visible');
        t.assertText('div div.template', 'Template Test',
            'Template text shown');
    })
    .then(function() {
        this.evaluate(function() { spf.app.currentView.clear() });
        t.assertDoesNotExist('#foo',
            'View foo as been removed from DOM');
    });

casper
    .describe("Template-based view  > Additional attributes")
    .setup('#foo', function() {
        spf.configure({
            views: {
                'foo': {
                    layout: '#template_1',
                    id: 'new_layout',
                    className: 'layout'
                }
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('div div.template',
            'Template 1 is visible');
        t.assertVisible('#new_layout',
            'Template 1 has the correct id');
        t.assertVisible('#new_layout.layout',
            'Template 1 has the correct CSS class');
    });
    
casper
    .describe("Template-based view  > Using a custom layout class")
    .setup('#foo', function() {
        spf.configure({
            views: {
                'foo': {
                    layout: TemplateLayoutView,
                    template: '#template_1'
                }
            }
        }).start();
    })
    .then(function() {
        t.assertVisible('div div.template',
            'Template 1 is visible');
        t.assertVisible('#custom',
            'Special view layout method called');
    });
    

casper
    .describe("Layout open and close")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: '#layout_1',
                bar: '#layout_2'
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
        t.assertNotVisible('#layout_2',
            'View bar is hidden');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ view: 'bar'}) });
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'bar');
        t.assertNotVisible('#layout_1',
            'View foo is hidden');
    })
    .back()
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
        t.assertNotVisible('#layout_2',
            'View bar is hidden');
    })
    .forward()
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'bar');
        t.assertNotVisible('#layout_1',
            'View foo is hidden');
    });
    
casper
    .describe("View with no layout or template specified")
    .setup('#foo', function() {
        spf.configure({
            views: {
                'foo': {
                    id: 'new_layout',
                    className: 'layout'
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#new_layout', 'foo', 'foo');
        t.assertVisible('#new_layout',
            'Layout is visible');
        t.assertVisible('#new_layout.layout',
            'Layout has the correct CSS class');
    });
    
casper.run(function() {
    t.done();
});