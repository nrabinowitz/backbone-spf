var t = casper.test,
    baseUrl = casper.baseUrl;
    
casper.start();
    
casper
    .describe("Custom router class")
    .setup('#custom', function() {
        spf.configure({
            views: {
                custom: {
                    layout: '#layout_1',
                    router: CustomRouter
                }
            }
        }).start();
    })
    .then(function() {
        t.assertAtRoute('#layout_1', 'custom', 'custom');
    })
    .thenOpen(baseUrl + '#custom/action1/1111')
    .then(function() {
        t.assertAtRoute('#layout_1', 'custom', 'custom/action1/1111');
        t.assertState('param1', '1111');
        t.assertState('action', 'action1');
    })
    .thenOpen(baseUrl + '#custom/action2/2222')
    .then(function() {
        t.assertAtRoute('#layout_1', 'custom', 'custom/action2/2222');
        t.assertState('param2', '2222');
        t.assertState('action', 'action2');
    })
    .thenOpen(baseUrl + '#custom')
    .then(function() {
        t.assertAtRoute('#layout_1', 'custom', 'custom');
        t.assertState('action', null);
    });
    
casper.run(function() {
    t.done();
});