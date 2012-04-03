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
    
casper.run(function() {
    t.done();
});