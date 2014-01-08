var SProxy = {};

var installSProxy = function (ctx) {
    "use strict";
    
    ctx.createProxy = function (func, before, after, context) {
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
};

installSProxy(SProxy);
