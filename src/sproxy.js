var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
    
    var makeProxyObject = function (obj) {
        var Proxy = function () {};
        Proxy.prototype = obj;
        return new Proxy();
    };
    
    var makeExecutionContext = function (target, args, that, handlerState, proxy) {
        return {
            returnValue : undefined,
            arguments : args,
            state : handlerState,
            proxyFunction : proxy,
            continue : function () {
                var retVal = target.apply(that, args);
                this.returnValue = retVal;
            }
        };
    };
    
    var createProxyFunction = function (target, handler, context) {
        var handlerState = {},
            proxy = function () {
                var that = context || this,
                    executionContext = makeExecutionContext(target, arguments, that, handlerState, proxy);

                handler.call(that, executionContext);

                return executionContext.returnValue;
        };

        return proxy;
    };
    
    var createProxyObject = function (obj, handler, filter) {        
        var proxy = makeProxyObject(obj),
            propName,
            propValue;
            
        filter = (filter && typeof (filter) == "function") ? filter : function () { return true };
        
        // Enumerate each property in the object and add a proxy for the objects and functions.
        for (propName in proxy) {
            if (obj.hasOwnProperty(propName)) {
                propValue = proxy[propName];
                
                if (typeof (propValue) === "function") {
                    if (filter(propName, propValue)) {
                        proxy[propName] = createProxyFunction(propValue, handler, obj);
                    }
                }
                else if (typeof (propValue) === "object") {
                    
                    
                    if (filter(propName, propValue)) {
                        proxy[propName] = createProxyObject(propValue, handler, filter);
                    }
                }
            }
        }
        
        return proxy;
    };
    
    var createProxy = function (target, handler, filter) {
        if (typeof target === "function") {
            return createProxyFunction(target, handler);
        }
        else if (typeof target === "object") {
            return createProxyObject(target, handler, filter);
        }
        
        throw new Error("A proxy can only be created for functions and objects.");
    };
    
    ctx.createProxy = createProxy;
    
    if (!Object.prototype.createProxy) {
        Object.prototype.createProxy = function (handler, filter) {
            return createProxy(this, handler, filter);
        };
    }
};

installSProxy(SProxy);
