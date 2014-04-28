var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
        
    var validateOptions = function (options) {
        var validOptionsMsg = "The following options are available:\n\n"  +
                              "1. onEnter: a function that executes before the target function (required if no \"onExit\" function is provided)\n" +
                              "2. onExit: a function that executes after the target function (required if no \"onEnter\" function is provided)\n" +
                              "3. context: an object to use for \"this\" when executing the new proxy method (optional).\n";
        
        if (!options) {
            throw new Error("Invalid options.\n" + validOptionsMsg);
        }
        
        if ((!options.onEnter) && (!options.onExit)) {
            throw new Error("Neither options.onEnter nor options.onExit were provided. At least one must be supplied.\n" + validOptionsMsg);
        }
    };
    
    var addReturnValueToArgumentsArray = function (args, retVal) {
        var newArgs = args;
        
        if (retVal) {
            var slice = Array.prototype.slice;
            newArgs = slice.apply(args, [0]);
            newArgs.push(retVal);
        }
        
        return newArgs;
    };
    
    var makeProxyObject = function (obj) {
        var Proxy = function () {};
        Proxy.prototype = obj;
        return new Proxy();
    };
    
    var createProxyFunction = function (func, options) {
        validateOptions(options);
        
        var onEnter = options.onEnter,
            onExit = options.onExit,
            context = options.context;
        
        return function () {
            var that = context || this,
                retContext,
                retVal;
            
            if (onEnter) {
                retContext = onEnter.apply(that, arguments);
                
                if (retContext && retContext.cancel) {
                    return retContext.returnValue;
                }
            }
            
            retVal = func.apply(that, arguments);
            
            if (onExit) {
                var newArgs = addReturnValueToArgumentsArray(arguments, retVal);
                                
                retContext = onExit.apply(that, newArgs);
                
                if (retContext && retContext.cancel) {
                    return retContext.returnValue;
                }
            }
            
            return retVal;
        };
    };
    
    var createProxyObject = function (obj, options) {
        validateOptions(options);
        
        var proxy = makeProxyObject(obj),
            propName,
            propValue,
            filter = options.filter && typeof (options.filter) == "function" ? options.filter : function () { return true };
        
        options = { onEnter: options.onEnter, onExit: options.onExit };
        
        // Enumerate each property in the object and add a proxy for the objects and functions.
        for (propName in proxy) {
            if (obj.hasOwnProperty(propName)) {
                if (typeof (proxy[propName]) === "function") {
                    options.context = obj; // Use the original object here to make sure the "this" pointer is handled correctly in the original methods.
                    propValue = proxy[propName];
                    
                    if (filter(propName, propValue)) {
                        proxy[propName] = createProxyFunction(propValue, options);
                    }
                }
                else if (typeof (proxy[propName] === "object")) {
                    delete options.context;
                    propValue = proxy[propName];
                    
                    if (filter(propName, propValue)) {
                        proxy[propName] = createProxyObject(propValue, options);
                    }
                }
            }
        }
        
        return proxy;
    };
    
    var createProxy = function (target, options) {
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
