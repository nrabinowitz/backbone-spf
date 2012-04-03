var t = casper.test,
    baseUrl = casper.baseUrl;

t.assertAtRoute = function(el, state, route) {
    t.assertVisible(el,
        'Element "' + el + '" is visible');
    t.assertEvalEquals(function() { return spf.state.get('view') }, state,
        'State is set to ' + state);
    t.assertEvalEquals(function() { return spf.router.getRoute() }, route,
        'Router returns ' + route);
    t.assertRoute(route,
        'Route is set to ' + route);
}
    
casper.start();

casper
    .describe("Implicit Routers")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: LayoutView,
                bar: '#layout_2',
                baz: {
                    layout: '#layout_3'
                },
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
    })
    .thenOpen(baseUrl + '#bar')
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'bar');
    })
    .thenOpen(baseUrl + '#baz')
    .then(function() {
        t.assertAtRoute('#layout_3', 'baz', 'baz');
    });
    
casper
    .describe("Static string-based routers > Single route")
    .setup('#test2', function() {
        spf.configure({
            views: {
                bar: {
                    layout: '#layout_2',
                    router: 'test2'
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_2', 'bar', 'test2');
    });
    
casper
    .describe("Static string-based routers  > Multiple routes 1")
    .setup('#test1', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#layout_1',
                    router: ['test1','foo']
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
    });
    
casper
    .describe("Static string-based routers > Multiple routes 2")
    .setup('#foo', function() {
        spf.configure({
            views: {
                foo: {
                    layout: '#layout_1',
                    router: ['test1','foo']
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
    });
    
casper
    .describe("Static string-based routers > Empty route")
    .setup('', function() {
        spf.configure({
            views: {
                baz: {
                    layout: '#layout_3',
                    router: ['', 'test3']
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_3', 'baz', 'test3');
    });
    
casper.run(function() {
    t.done();
});