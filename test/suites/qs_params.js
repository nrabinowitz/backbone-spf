var t = casper.test,
    baseUrl = casper.baseUrl;

casper.start();


casper
    .describe("Setting querystring parameters")
    .setup('#foo', function() {
        spf.addParameter('param1');
        spf.addParameter('param2', { deserialize: parseInt });
        spf.addParameter('param3', {
            deserialize: function(s) { 
                return s.split(',').map(function(i) { return parseInt(i) }) 
            },
            serialize: function(a) { return a.join(',') },
            defaultValue: [0,0]
        });
        spf.configure({
            views: {
                foo: '#layout_1'
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'foo', 'foo');
        t.assertEvalEquals(function() { return JSON.stringify(spf.state.get('param3')) }, '[0,0]',
            'Default set for param3');
        t.assertEvalEquals(function() { return spf.router.getPermalink() }, baseUrl + '#foo?param3=0,0',
            'Permalink set correctly with param3');
    })
    .then(function() {
        // a bit of a hack, as parseInt drops the letters
        this.evaluate(function() { spf.state.set('param2', '1aaa') });
        t.assertState('param2', 1,
            'Deserialization correct for param2');
        t.assertMatch(this.evaluate(function() { return spf.router.getPermalink() }), /param2=1/,
            'Permalink set correctly with param2');
    })
    .then(function() {
        // a bit of a hack, as parseInt drops the letters
        this.evaluate(function() { spf.state.set('param1', 'test') });
        t.assertMatch(this.evaluate(function() { return spf.router.getPermalink() }), /param1=test/,
            'Permalink set correctly with param1');
    })
    .thenOpen(baseUrl + '#foo?param1=spam&param2=2xxx&param3=1,1')
    .then(function() {
        t.assertVisible('#layout_1',
            'Element "#layout_1" is visible');
        t.assertEvalEquals(function() { return spf.router.getRoute() }, 'foo',
            'Router returns "foo"');
        t.assertState('param1', 'spam',
            'Querystring set param1');
        t.assertState('param2', 2,
            'Querystring set param2');
        t.assertEvalEquals(function() { return JSON.stringify(spf.state.get('param3')) }, '[1,1]',
            'Querystring set param3');
        t.assertMatch(this.evaluate(function() { return spf.router.getPermalink() }), /param1=spam/,
            'Permalink set correctly with param1');
        t.assertMatch(this.evaluate(function() { return spf.router.getPermalink() }), /param2=2/,
            'Permalink set correctly with param2');
        t.assertMatch(this.evaluate(function() { return spf.router.getPermalink() }), /param3=1,1/,
            'Permalink set correctly with param3');
    });
    
casper.run(function() {
    t.done();
});