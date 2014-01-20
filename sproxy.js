var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
    
    var validateAndReturnArgumentsAsDto = function () {
        var validArgsMsg = "Arguments must be provided in one of the two following formats:\n\n" +
                           "1. For a single argument, assume a DTO with func, before, after, and context properties.\n" +
                           "2. For multiple arguments, assume up to four in the following order:\n" +
                                "a. A function to proxy (required)\n" +
                                "b. A before function (required if no \"after\" function is provided)\n" +
                                "c. An after function (required if no \"before\" function is provided)\n" +
                                "d. A context object to override \"this\" when executing the new proxy method (optional).\n";
        
        var argsDto = {
            func: undefined,
            before: undefined,
            after: undefined,
            context: undefined
        };
        
        if (!arguments || arguments.length === 0) {
            throw new Error("Invalid arguments. No arguments were supplied to the function.\n" + validArgsMsg);
        } else if ((arguments.length === 1) && (typeof arguments[0] === "object")) {
            // Arguments can be provided as a DTO with func, before, after, and context properties.
            argsDto = arguments[0];
        } else if (typeof arguments[0] === "function") {
            // Arguments can also be provided as individual arguments.
            // Consolidate these arguments into a single DTO.
            argsDto.func = arguments[0];
            argsDto.before = arguments[1];
            argsDto.after = arguments[2];
            argsDto.context = arguments[3];
        } else {
            throw new Error("Invalid arguments. " + validArgsMsg);
        }
        
        if (!argsDto.func) {
            throw new Error("No function was provided to proxy.\n" + validArgsMsg);
        }
        
        if ((!argsDto.before) && (!argsDto.after)) {
            throw new Error("No functions were provided for the before and after arguments. At least one must be supplied.\n" + validArgsMsg);
        }
        
        return argsDto;
    };
    
    var createProxy = function () {
        var args = validateAndReturnArgumentsAsDto.apply(this, arguments),
            func = args.func,
            before = args.before,
            after = args.after,
            context = args.context;
        
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
    
    ctx.createProxy = createProxy;
    
    ctx.createProxyObject = function (obj, before, after) {
        var proxy = makeProxyObject(obj), item, func;
        
        // Enumerate each method in the object and add a proxy method.
        // The original object is used as the context instead of the proxy
        // which keeps "this" pointing to the right place in the original methods.
        for (item in proxy) {
            if (typeof (proxy[item]) === "function") {
                func = proxy[item];
                proxy[item] = createProxy(func, before, after, obj);
            }
        }
        
        return proxy;
    };
};

installSProxy(SProxy);
