var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
    
    var createProxy = function (func, before, after, context) {
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
                after.apply(that, arguments);
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
