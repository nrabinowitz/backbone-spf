/*
 * Node.js utility for getting a list of all r.js required modules in the 
 * specified configuraton file. Prints a list of module names suitable for
 * the r.js "include" parameter. Usage:
 * 
 *  $ node get_modules.js <config_file> [<view>]
 */

var fs = require('fs'),
    configFile = process.argv[2],
    topView = process.argv[3];

if (!configFile) process.exit(0);    

var text = fs.readFileSync(configFile).toString();
// a bit ugly
global.define = function(o) { return o };
var config = eval(text),
    modules = config.globalViews || [];
    
function checkRequire(viewConfig) {
    var layout = viewConfig.layout;
    // does this look like a require dependency?
    return (layout &&
        typeof layout == "string"
        // string test could match some selectors, so allow explicit choices
        && !viewConfig.noRequire
        && (viewConfig.useRequire || layout.match(/^\w+$/) || layout.match(/\//)));
}

function concatConfigs(configs) {
    for (var key in configs) {
        concatView(configs[key]);
    }
}

function concatView(viewConfig) {
    viewConfig = typeof viewConfig == "string" ? 
        { layout: viewConfig } : viewConfig;
    if (Array.isArray(viewConfig)) {
        return viewConfig.forEach(concatView);
    }
    if (checkRequire(viewConfig)) modules.push(viewConfig.layout);
    if (viewConfig.slots) concatConfigs(viewConfig.slots);
}

if (topView) {
    if (!(topView in config.views)) 
        throw "The view " + topView + " was not found in the configuration file " + configFile;
    concatView(config.views[topView]);
} else {
    concatConfigs(config.views);
}

// spit out registered modules
console.log(modules.join(','));