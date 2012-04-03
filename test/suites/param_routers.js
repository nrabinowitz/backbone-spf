var t = casper.test,
    baseUrl = casper.baseUrl;
    
casper.start();
    
casper
    .describe("Parameterized string-based routers")
    .setup('', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#layout_1',
                    router: ['','foo/:param1']
                },
                bar: {
                    layout: '#layout_2',
                    router: ['bar', 'bar/:param2']
                },
                baz: {
                    layout: '#layout_3',
                    router: ['baz', 'baz/:param3', 'baz/:param3/:param4']
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', '');
    })
    .thenOpen(baseUrl + '#foo/1111')
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo/1111');
        t.assertState('param1', '1111');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'bar');
    })
    .thenOpen(baseUrl + '#bar/2111')
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'bar/2111');
        t.assertState('param2', '2111');
    })
    .thenOpen(baseUrl + '#baz')
    .then(function() {
        t.assertAtRoute('#layout_3', 'baz', 'baz');
    })
    .thenOpen(baseUrl + '#baz/2131')
    .then(function() {
        t.assertAtRoute('#layout_3', 'baz', 'baz/2131');
        t.assertState('param3', '2131');
    })
    .thenOpen(baseUrl + '#baz/2141/3111')
    .then(function() {
        t.assertAtRoute('#layout_3', 'baz', 'baz/2141/3111');
        t.assertState('param3', '2141');
        t.assertState('param4', '3111');
    });
    
casper
    .describe("Parameterized routers > State listening")
    .setup('', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#layout_1',
                    router: ['','foo/:param1']
                },
                bar: {
                    layout: '#layout_2',
                    router: ['bar', 'bar/:param2']
                },
                baz: {
                    layout: '#layout_3',
                    router: ['baz', 'baz/:param3', 'baz/:param3/:param4']
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', '');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param1: '1111'}) });
        t.assertAtRoute('#layout_1', 'foo', 'foo/1111');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param1: '1212'}) });
        t.assertAtRoute('#layout_1', 'foo', 'foo/1212');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ view: 'bar'}) });
        t.assertAtRoute('#layout_2', 'bar', 'bar');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param2: '2222'}) });
        t.assertAtRoute('#layout_2', 'bar', 'bar/2222');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ view: 'baz'}) });
        t.assertAtRoute('#layout_3', 'baz', 'baz');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param3: '3333'}) });
        t.assertAtRoute('#layout_3', 'baz', 'baz/3333');
    })
    .then(function() {
        this.evaluate(function() { spf.state.set({ param4: '4444'}) });
        t.assertAtRoute('#layout_3', 'baz', 'baz/3333/4444');
    });
    
casper.run(function() {
    t.done();
});