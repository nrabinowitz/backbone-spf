// Tests require PhantomJS and Casper.js

var casper = require('casper').create({
        verbose: true
        // logLevel: 'debug'
    }),
    t = casper.test,
    baseUrl = casper.baseUrl = "http://localhost:8080/app.html";
    
// for easier syntax
casper.describe = function(msg) {
    if (this.started) {
        this.then(function() { t.comment(msg) });
        // let's clear the page state while we're at it
        this.thenOpen('about:blank');
    } else {
        t.comment(msg);
    }
    return this;
};

casper.setup = function(route, config) {
    this.thenOpen(baseUrl + route, function() {
        casper.evaluate(config);
    });
    return this;
}
    
// extend the tester with some custom assertions

t.assertText = function(selector, expected, message) {
    f = new Function("return $('" + selector + "').first().text().trim()");
    t.assertEvalEquals(f, expected, message);
}

t.assertInText = function(selector, expected, message) {
    f = new Function("return $('" + selector + "').first().text().trim()");
    var text = casper.evaluate(f);
    t.assert(text.indexOf(expected) >= 0, message);
}

t.assertVisible = function(selector, message) {
    f = new Function("return !!$('" + selector + ":visible').length")
    t.assertEval(f, message);
}
t.assertNotVisible = function(selector, message) {
    f = new Function("return !$('" + selector + ":visible').length")
    t.assertEval(f, message);
}
t.assertDoesNotExist = function(selector, message) {
    f = new Function("return !$('" + selector + "').length")
    t.assertEval(f, message);
}

t.assertRoute = function(expected, message) {
    var getHash = function() {
        return window.location.hash.substr(1);
    };
    if (expected instanceof RegExp) {
        t.assertMatch(casper.evaluate(getHash), expected, message);
    } else {
        t.assertEvalEquals(getHash, expected, message);
    }
};

// app-specific tests

t.assertState = function(property, expected, message) {
    f = new Function("return spf.state.get('" + property + "')");
    t.assertEvalEquals(f, expected, 
        'State property "' + property + '" is set to ' + expected);
};

t.assertAtRoute = function(el, state, route) {
    t.assertVisible(el,
        'Element "' + el + '" is visible');
    t.assertState('view', state);
    t.assertEvalEquals(function() { return spf.router.getRoute() }, route,
        'Router returns ' + route);
    t.assertRoute(route,
        'Route is set to ' + route);
};

// set up and run suites
var fs = require('fs'),
    tests = [];

if (casper.cli.args.length) {
    tests = casper.cli.args.filter(function(path) {
        return fs.isFile(path) || fs.isDirectory(path);
    });
} else {
    casper.echo('No test path passed, exiting.', 'RED_BAR', 80);
    casper.exit(1);
}

t.on('tests.complete', function() {
    this.renderResults(true);
});

t.runSuites.apply(casper.test, tests);