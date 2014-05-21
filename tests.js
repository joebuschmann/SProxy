
test("Verify onEnter and onExit method execution.", function (assert) {
    var onEnterInvokedCount = 0;
    var functionInvokedCount = 0;
    var onExitInvokedCount = 0;
    
    var onEnter = function() {
        onEnterInvokedCount++;
    };
    
    var func = function() {
        functionInvokedCount++;
    };
    
    var onExit = function() {
        onExitInvokedCount++;
    };
    
    var options = { onEnter: onEnter, onExit: onExit };
    
    // Create and test a proxy by passing arguments individually.
    var proxy = SProxy.createProxy(func, options);
    
    proxy();
    
    assert.strictEqual(onEnterInvokedCount, 1, "The onEnter function should have been invoked one time.");
    assert.strictEqual(functionInvokedCount, 1, "The proxied function should have been invoked one time.");
    assert.strictEqual(onExitInvokedCount, 1, "The onExit function should have been invoked one time.");
    
    // Create and test a proxy by invoking createProxy from Object.prototype.
    proxy = func.createProxy(options);
    
    proxy();
    
    assert.strictEqual(onEnterInvokedCount, 2, "The onEnter function should have been invoked two times.");
    assert.strictEqual(functionInvokedCount, 2, "The proxied function should have been invoked two times.");
    assert.strictEqual(onExitInvokedCount, 2, "The onExit function should have been invoked two times.");
});

test("Verify correct arguments passed to onEnter, onExit, and proxied function.", function (assert) {
    var onEnterArguments;
    var funcArguments;
    var onExitArguments;
    
    var onEnter = function() {
        onEnterArguments = arguments;
    };
    
    var func = function() {
        funcArguments = arguments;
    };
    
    var onExit = function() {
        onExitArguments = arguments;
    };
    
    var options = { onEnter: onEnter, onExit: onExit };
    
    var proxy = SProxy.createProxy(func, options);
    
    proxy(4, 5, 6);
    
    var slice = Array.prototype.slice;
    
    assert.ok(onEnterArguments, "The onEnter arguments should have a value.");
    assert.strictEqual(onEnterArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(onEnterArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(funcArguments, "The proxied function arguments should have a value.");
    assert.strictEqual(funcArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(funcArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(onExitArguments, "The onExit arguments should have a value.");
    assert.strictEqual(onExitArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(onExitArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
});

test("Verify \"this\" points to the correct object when creating a proxy for a method and no context is provided.", function (assert) {
    var anObject = {
        value1: 23,
        WhatIsValue1: function() {
           return this.value1;
        }
    };
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");

    anObject.WhatIsValue1 = SProxy.createProxy(anObject.WhatIsValue1, { onEnter: function () {} });
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");
});

test("Verify \"this\" points to the correct context if a custom context is provided.", function (assert) {
    var context = {};
    
    var func = function () {
        this.value1 = 23;
        this.value2 = 45;
    };

    var options = { onEnter: function () {}, onExit: function () {}, context: context };
    
    var proxy = SProxy.createProxy(func, options);
    
    proxy();
    
    assert.strictEqual(context.value1, 23, "The custom context should be altered by the proxy.");
    assert.strictEqual(context.value2, 45, "The custom context should be altered by the proxy.");
    
    var global = (function () { return this; })();
    
    assert.strictEqual(global.value1, undefined, "Value 1 should not exist in the global scope.");
    assert.strictEqual(global.value2, undefined, "Value 2 should not exist in the global scope.");
});

test("Verify cancellation of executing the proxied function.", function(assert) {
    var cancel = false;
    
    var onEnter = function() {
        return { cancel: cancel, returnValue: 23 };
    };
    
    var func = function() {
        return 45;
    };
    
    var proxy = SProxy.createProxy(func, { onEnter: onEnter });
    
    var retVal = proxy();
    
    assert.equal(retVal, 45, "The \"onEnter\" method should not cancel execution.");
    
    cancel = true;
    retVal = proxy();
    
    assert.strictEqual(retVal, 23, "The \"onEnter\" method should not cancel execution.");
});

test("Verify modification of the return value in the onExit function.", function (assert) {
    var arg = 23,
        // Set up a trivial onExit function to modify the return value.
        // The return value from the target function is passed in as an extra argument.
        onExit = function (x) {
            assert.strictEqual(arguments.length, 2, "There should be two arguments passed in. One is x and the other is the return value.");
            assert.strictEqual(arguments[0], arg, "The first argument should have a value of " + arg + ".");
            assert.strictEqual(arguments[1], arg, "The second argument should have a value of " + arg + ".");
            
            var retValue = arguments[1];
            return {cancel: true, returnValue: retValue + x};
        },
        proxy = (function (x) { return x; }).createProxy({onExit: onExit}),
        actualValue = proxy(arg);
    
    assert.strictEqual(actualValue, arg + arg, "The return value should have been modified by the onExit function.");
});

test("Verify creating a proxy for all methods in an object.", function(assert) {
    var onEnterCount = 0,
        onExitCount = 0,
        proxy,
        obj = {
            method1Called: false,
            method2Called: false,
            method1: function () {
                this.method1Called = true;
            },
            method2: function () {
                this.method2Called = true;
            }
        };
        
    var options = { onEnter: function () { onEnterCount++; }, onExit: function () { onExitCount++; } };
    
    proxy = SProxy.createProxy(obj, options);
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(onEnterCount, 2, "The onEnter function should have been invoked.");
    assert.strictEqual(onExitCount, 2, "The onExit function should have been invoked.");
    
    assert.strictEqual(Object.getPrototypeOf(proxy), obj, "The original object should be the proxy's prototype.");
    
    // Create the proxy using createProxy from Object.prototype.
    proxy = obj.createProxy(options);
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(onEnterCount, 4, "The onEnter function should have been invoked.");
    assert.strictEqual(onExitCount, 4, "The onExit function should have been invoked.");
    
    assert.strictEqual(Object.getPrototypeOf(proxy), obj, "The original object should be the proxy's prototype.");
});

test("Verify creating a proxy doesn't alter the original object.", function (assert) {
    var original = {
        method1: function() {
           return 23;
        }
    };
    
    var onEnter = function() {
        return { cancel: true, returnValue: 45 };
    };
    
    var proxy = SProxy.createProxy(original, { onEnter: onEnter });
    
    assert.strictEqual(original.method1(), 23, "The original object should not be altered when creating the proxy.");
    assert.strictEqual(proxy.method1(), 45, "The proxy object should return a different value.");
});

test("Verify the return value isn't passed to the onExit function when it is undefined.", function (assert) {
    var argCount = 0,
        proxy = SProxy.createProxy(function () {}, { onExit: function () { argCount = arguments.length; } });
    
    proxy(1, 2, 3);
    
    assert.strictEqual(argCount, 3, "Because there is no return value from the proxied function, there should not be an extra argument passed to the \"onExit\" function.");
});

test("Verify the return value is passed to the onExit function when it is defined.", function (assert) {
    var argCount = 0,
        lastArg,
        func = function () { return 23; },
        proxy = SProxy.createProxy(func, { onExit: function () { argCount = arguments.length; lastArg = arguments[argCount - 1]; } });
    
    proxy(1, 2, 3);
    
    assert.strictEqual(argCount, 4, "The return value of the proxied function should be passed to the \"onExit\" function as the last argument.");
    assert.strictEqual(lastArg, 23, "The return value should have a value of 23.");
});

test("Verify nesting of onEnter and onExit functions by creating a proxy of a proxy.", function (assert) {
    var executionOrder = [],
        onEnter1 = function () { executionOrder.push("onEnter1"); },
        onEnter2 = function () { executionOrder.push("onEnter2"); },
        onExit1 = function () { executionOrder.push("onExit1"); },
        onExit2 = function () { executionOrder.push("onExit2"); },
        func = function () {};
    
    var proxy = SProxy.createProxy(func, { onEnter: onEnter1, onExit: onExit1 });
    proxy = SProxy.createProxy(proxy, { onEnter: onEnter2, onExit: onExit2 });
    
    proxy();
    
    assert.deepEqual(executionOrder, ["onEnter2", "onEnter1", "onExit1", "onExit2"],
                     "The execution order of onEnter and onExit functions should be onEnter2(), onEnter1(), onExit1(), onExit2()."); 
});

test("Verify nested objects are proxied in addition to the parent.", function (assert) {
    var parentObj = {},
        childObj = {};
    
    parentObj.parentMethod = function() {
        this.parentMethodCalled = true;
    };
    
    parentObj.childObj = childObj;
    
    childObj.childMethod = function() {
        this.childMethodCalled = true;
    };
    
    var proxy = parentObj.createProxy({ onEnter: function() { this.onEnterCalled = true } });
    
    proxy.parentMethod();
    
    assert.strictEqual(parentObj.parentMethodCalled, true);
    assert.strictEqual(parentObj.onEnterCalled, true);
    assert.strictEqual(childObj.childMethodCalled, undefined);
    assert.strictEqual(childObj.onEnterCalled, undefined);
    
    proxy.childObj.childMethod();
    
    assert.strictEqual(childObj.childMethodCalled, true);
    assert.strictEqual(childObj.onEnterCalled, true);
});

test("Verify the original object is still the context for a proxy of a proxy.", function (assert) {
    var originalObj = {
        method1Called : false,
        method1: function () {
            this.method1Called = true;
            assert.strictEqual(this, originalObj, "The \"this\" pointer should point to the original object in the proxy regardless of the number of proxy layers.");
        }
    },
        args = {onEnter: function () {}};
    
    // Create a proxy of a proxy.
    var proxyOfAProxy = originalObj.createProxy(args).createProxy(args);
    
    proxyOfAProxy.method1();
    
    assert.strictEqual(originalObj.method1Called, true, "The original object should be the target of the \"this\" pointer regardless of how many layers of proxies are involved.");
});

test("Check for error message when bad args are passed.", function (assert) {
    var someObj = {},
        someFunc = function () {};
    
    assert.throws(function () { someObj.createProxy({}); });
    assert.throws(function () { someFunc.createProxy({}); });
});

test("Conditionally create proxies based on method names.", function (assert) {
    var someObj = {
        method1 : function () {},
        method2 : function () {}
    };
    
    // Create a filter that only proxies method1.
    var filterFunc = function (propName, propValue) {
        if (propName === "method1") {
            return true;
        }
        
        return false;
    };
    
    var callCount = 0;
    
    var proxy = someObj.createProxy({ onEnter: function () { callCount++; }, filter: filterFunc });
    
    proxy.method1();
    assert.strictEqual(callCount, 1);
    
    proxy.method2();
    assert.strictEqual(callCount, 1);
});

test("Conditionally create proxies based on object property values.", function (assert) {
    var someObj = {
        object1 : { proxyMe : true, aMethod : function () {} },
        object2 : { proxyMe : false, aMethod : function () {} }
    };
    
    // Create a filter that only proxies object1.
    var filterFunc = function (propName, propValue) {
        if (propValue && propValue.proxyMe) {
            return true;
        }
        
        return false;
    };
    
    var callCount = 0;
    
    var proxy = someObj.createProxy({ onEnter: function () { callCount++; }, filter: filterFunc });
    
    proxy.object1.aMethod();
    assert.strictEqual(callCount, 1);
    
    proxy.object2.aMethod();
    assert.strictEqual(callCount, 1);
});

test("Verify onError and onFinal method execution", function (assert) {
    var func = function () { throw new Error("This error was raised for testing purposes."); },
        isErrorHandled = false,
        isFinalHandled = false,
        errorHandler = function () { isErrorHandled = true; },
        finalHandler = function () { isFinalHandled = true; },
        proxy = func.createProxy({ onEnter : function () {}, onError : errorHandler, onFinal : finalHandler });
    
    proxy();
    
    assert.strictEqual(isErrorHandled, true);
    assert.strictEqual(isFinalHandled, true);
});
