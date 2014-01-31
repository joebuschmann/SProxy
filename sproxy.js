var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
    
    var global = (function () { return this; })();
    
    var validateOptions = function (options) {
        var validOptionsMsg = "The following options are available:\n\n"  +
                              "1. before: a function that executes before the target function (required if no \"after\" function is provided)\n" +
                              "2. after: a function that executes after the target function (required if no \"before\" function is provided)\n" +
                              "3. context: an object to use for \"this\" when executing the new proxy method (optional).\n";
        
        if (!options) {
            throw new Error("Invalid options.\n" + validOptionsMsg);
        }
        
        if ((!options.before) && (!options.after)) {
            throw new Error("Neither options.before nor options.after were provided. At least one must be supplied.\n" + validOptionsMsg);
        }
    };
    
    var createProxyFunction = function (func, options) {
        validateOptions(options);
        
        var before = options.before,
            after = options.after,
            context = options.context;
        
        return function () {
            var that = context || this,
                retContext,
                retVal,
                afterArgs;
            
            if (before) {
                retContext = before.apply(that, arguments);
                
                if (retContext && retContext.cancel) {
                    return retContext.returnValue;
                }
            }
            
            retVal = func.apply(that, arguments);
            
            if (after) {
                var afterArgs = arguments;
                
                if (retVal) {
                    var slice = Array.prototype.slice;
                    afterArgs = slice.apply(arguments, [0]);
                    afterArgs.push(retVal);
                }
                
                after.apply(that, afterArgs);
            }
            
            return retVal;
        };
    };
    
    var makeProxyObject = function (obj) {
        var Proxy = function () {};
        Proxy.prototype = obj;
        return new Proxy();
    };
    
    var createProxyObject = function (obj, options) {
        validateOptions(options);
        
        var proxy = makeProxyObject(obj), item, func;
        
        // Make a copy of options and make sure the context is the object itself.
        // The this pointer in the proxy methods has to point to the original object.
        options = { before: options.before, after: options.after, context: obj };
        
        // Enumerate each method in the object and add a proxy method.
        // The original object is used as the context instead of the proxy
        // which keeps "this" pointing to the right place in the original methods.
        for (item in proxy) {
            if (obj.hasOwnProperty(item) && typeof (proxy[item]) === "function") {
                func = proxy[item];
                proxy[item] = createProxyFunction(func, options);
            }
        }
        
        return proxy;
    };
    
    var createProxy = function (target, options) {
        if (target === global) {
            throw new Error("A proxy cannot be created for the global object.");
        }
        
        if (typeof target === "function") {
            return createProxyFunction(target, options);
        }
        else if (typeof target === "object") {
            return createProxyObject(target, options);
        }
        
        throw new Error("A proxy can only be created for functions and objects.");
    };
    
    ctx.createProxy = createProxy;
    
    if (!Object.prototype.createProxy) {
        Object.prototype.createProxy = function (options) {
            return createProxy(this, options);
        };
    }
};

installSProxy(SProxy);
