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
    
casper.run(function() {
    t.done();
});