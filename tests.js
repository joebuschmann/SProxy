
test("Verify simple use case scenario of before action, invocation of continue(), and after action.", function (assert) {
    var beforeInvocationCount = 0;
    var funcInvocationCount = 0;
    var afterInvocationCount = 0;    
    
    var handler = function(executionContext) {
        beforeInvocationCount++;
        
        executionContext.continue();
        
        afterInvocationCount++;
    };
    
    var func = function() {
        funcInvocationCount++;
    };
    
    // Create and test a proxy using the SProxy namespace.
    var proxy = SProxy.createProxy(func, handler);
    
    proxy();
    
    assert.strictEqual(beforeInvocationCount, 1, "The onEnter function should have been invoked one time.");
    assert.strictEqual(funcInvocationCount, 1, "The proxied function should have been invoked one time.");
    assert.strictEqual(afterInvocationCount, 1, "The onExit function should have been invoked one time.");
    
    // Create and test a proxy by invoking createProxy from Object.prototype.
    proxy = func.createProxy(handler);
    
    proxy();
    
    assert.strictEqual(beforeInvocationCount, 2, "The onEnter function should have been invoked two times.");
    assert.strictEqual(funcInvocationCount, 2, "The proxied function should have been invoked two times.");
    assert.strictEqual(afterInvocationCount, 2, "The onExit function should have been invoked two times.");
});

test("Verify correct arguments passed to execution context and proxied function.", function (assert) {
    var executionContextArgs;
    var funcArguments;
    
    var handler = function(executionContext) {
        executionContextArgs = executionContext.arguments;
        executionContext.continue();
    };
    
    var func = function() {
        funcArguments = arguments;
    };
    
    var proxy = SProxy.createProxy(func, handler);
    
    proxy(4, 5, 6);
    
    var slice = Array.prototype.slice;
    
    assert.ok(executionContextArgs, "The execution context arguments should have a value.");
    assert.strictEqual(executionContextArgs.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(executionContextArgs), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(funcArguments, "The proxied function arguments should have a value.");
    assert.strictEqual(funcArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(funcArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
});

test("Verify the return value from the target function is returned correctly.", function (assert) {
    var handler = function(executionContext) {
        executionContext.continue();
    };
    
    var func = function() {
        return 22 + 1;
    };
    
    var proxy = SProxy.createProxy(func, handler);
    
    var retValue = proxy();
    
    assert.strictEqual(retValue, 23, "The target function's return value should be returned by the proxy when it is not ooverridden.");
});

test("Verify an overridden return value is correct.", function (assert) {
    var handler = function(executionContext) {
        executionContext.continue();
        executionContext.returnValue = 45;
    };
    
    var func = function() {
        return 22 + 1;
    };
    
    var proxy = SProxy.createProxy(func, handler);
    
    var retValue = proxy();
    
    assert.strictEqual(retValue, 45, "The target function's return value should be returned by the proxy when it is not ooverridden.");
});

test("Verify the original method still points to \"this\" when it is proxied.", function (assert) {
    var anObject = {
        value1: 23,
        WhatIsValue1: function() {
           return this.value1;
        },
        childObject: {
            value1: 23,
            WhatIsValue1: function() {
               return this.value1;
            }
        }},
        proxyObject,
        handler = function (ctx) { ctx.continue(); };
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "Initial sanity check failed.");

    // Create using method on SProxy.
    proxyObject = SProxy.createProxy(anObject, handler);
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" is incorrect. Is \"this\" pointing to the right place?");
    assert.strictEqual(anObject.childObject.WhatIsValue1(), 23, "The value for \"value1\" is incorrect. Is \"this\" pointing to the right place?");
    
    // Create using method on object prototype.
    proxyObject = anObject.createProxy(handler);
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" is incorrect. Is \"this\" pointing to the right place?");
    assert.strictEqual(anObject.childObject.WhatIsValue1(), 23, "The value for \"value1\" is incorrect. Is \"this\" pointing to the right place?");
});

test("Verify \"this\" points to the object in the handler function.", function (assert) {
    var obj = {
            method1: function () { },
            numProperty: 23,
            childObject: {
                method1: function () { },
                numProperty: 23
            }
        },
        handler = function (ctx) {
            this.handlerInvoked = true;
            
            assert.strictEqual(this.numProperty, 23, "The handler method should be able to access the object via \"this\".");
        },
        proxy = obj.createProxy(handler);
    
    proxy.method1();
    proxy.childObject.method1();
    
    assert.strictEqual(proxy.handlerInvoked, true, "The handler function doesn't have access to the object via \"this\".");
    assert.strictEqual(proxy.childObject.handlerInvoked, true, "The handler function doesn't have access to the object via \"this\".");
});

test("Verify cancellation of executing the proxied function.", function(assert) {
    var targetExecuted,
        func = function () { targetExecuted = true; },
        handler = function (ctx) { targetExecuted = false; };  // Handler does not call continue() which effectively cancels execution of the original function.
    
    var proxy = SProxy.createProxy(func, handler);
    
    proxy();
    
    assert.notStrictEqual(targetExecuted, undefined, "targetExecuted should be a boolean value.");
    assert.strictEqual(targetExecuted, false, "The original function should not have been executed because the handler did not call ctx.continue().");
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
        },
        handler = function (ctx) { 
            onEnterCount++;
            ctx.continue();
            onExitCount++;
        };
    
    // Create the proxy using createProxy from SProxy namespace.
    proxy = SProxy.createProxy(obj, handler);
    
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
    proxy.method1Called = false;
    proxy.method2Called = false;
    
    proxy = obj.createProxy(handler);
    
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
    var obj = {
        method1: function() {
           return 23;
        }
    };
    
    var handler = function(ctx) {
        ctx.continue();
        ctx.returnValue = 45;
    };
    
    var proxy = SProxy.createProxy(obj, handler);
    
    assert.strictEqual(obj.method1(), 23, "The original object should not be altered when creating the proxy.");
    assert.strictEqual(proxy.method1(), 45, "The proxy object should return a different value.");
});

test("Verify execution order of nested proxies.", function (assert) {
    var executionOrder = [],
        handler1 = function (ctx) {
            executionOrder.push("onEnter1");
            ctx.continue();
            executionOrder.push("onExit1");
        },
        handler2 = function (ctx) {
            executionOrder.push("onEnter2");
            ctx.continue();
            executionOrder.push("onExit2");
        },
        func = function () {};
    
    var proxy = SProxy.createProxy(func, handler1);
    proxy = SProxy.createProxy(proxy, handler2);
    
    proxy();
    
    assert.deepEqual(executionOrder, ["onEnter2", "onEnter1", "onExit1", "onExit2"],
                     "The execution order for the handler functions should be onEnter2, onEnter1, onExit1, onExit2."); 
});

test("Verify nested objects are proxied in addition to the parent.", function (assert) {
    var parentObj = {},
        childObj = {},
        handler = function (ctx) {
            this.handlerCalled = true;
            ctx.continue();
        };
    
    parentObj.parentMethod = function() {
        this.parentMethodCalled = true;
    };
    
    parentObj.childObj = childObj;
    
    childObj.childMethod = function() {
        this.childMethodCalled = true;
    };
    
    var proxy = parentObj.createProxy(handler);
    
    proxy.parentMethod();
    
    assert.strictEqual(parentObj.parentMethodCalled, true);
    assert.strictEqual(parentObj.handlerCalled, true);
    assert.strictEqual(childObj.childMethodCalled, undefined);
    assert.strictEqual(childObj.handlerCalled, undefined);
    
    proxy.childObj.childMethod();
    
    assert.strictEqual(childObj.childMethodCalled, true);
    assert.strictEqual(childObj.handlerCalled, true);
});

test("Verify the original object is still the context for a proxy of a proxy.", function (assert) {
    var originalObj = {
            method1Called : false,
            method1: function () {
                this.method1Called = true;
                assert.strictEqual(this, originalObj, "The \"this\" pointer should point to the original object in the proxy regardless of the number of proxy layers.");
            }
        },
        handler = function (ctx) { ctx.continue(); };
    
    // Create a proxy of a proxy.
    var proxyOfAProxy = originalObj.createProxy(handler).createProxy(handler);
    
    proxyOfAProxy.method1();
    
    assert.strictEqual(originalObj.method1Called, true, "The original object should be the target of the \"this\" pointer regardless of how many layers of proxies are involved.");
});

test("Conditionally create proxies based on method names.", function (assert) {
    var someObj = {
            method1 : function () {},
            method2 : function () {}
        },
        callCount = 0,
        handler = function (ctx) {
            callCount++;
            ctx.continue();
        };
    
    // Create a filter that only proxies method1.
    var filterFunc = function (propName, propValue) {
        if (propName === "method1") {
            return true;
        }
        
        return false;
    };
    
    var proxy = someObj.createProxy(handler, filterFunc);
    
    proxy.method1();
    assert.strictEqual(callCount, 1);
    
    proxy.method2();
    assert.strictEqual(callCount, 1, "A proxy should not have been created for method2 because of the filter.");
});

test("Conditionally create proxies based on object property values.", function (assert) {
    var someObj = {
            object1 : { proxyMe : true, aMethod : function () {} },
            object2 : { proxyMe : false, aMethod : function () {} }
        },
        callCount = 0,
        handler = function (ctx) {
            callCount++;
            ctx.continue();
        };
    
    // Create a filter that only proxies object1.
    var filterFunc = function (propName, propValue) {
        if (propValue && ((typeof (propValue) === "function") || propValue.proxyMe)) {
            return true;
        }
        
        return false;
    };
    
    var proxy = someObj.createProxy(handler, filterFunc);
    
    proxy.object1.aMethod();
    assert.strictEqual(callCount, 1);
    
    proxy.object2.aMethod();
    assert.strictEqual(callCount, 1, "A proxy should not have been created for object2 because of the filter.");
});

test("Verify the handler function can store state in between invocations.", function (assert) {
    var expectedCallCount = undefined;
    var proxy = SProxy.createProxy(function () {}, function (ctx) {
        assert.strictEqual(ctx.state.callCount, expectedCallCount);

        if (!ctx.state.callCount) {
            ctx.state.callCount = 0;
        }

        ctx.state.callCount++;
    });

    proxy();
    expectedCallCount = 1;
    proxy();
    expectedCallCount = 2;
 });

test("Verify the handler function can store state on the proxy function to share with the outside world..", function (assert) {
    var handler = function (ctx) {
        assert.notStrictEqual(ctx.proxyFunction, undefined);

        if (!ctx.proxyFunction.callCount) {
            ctx.proxyFunction.callCount = 0;
        }

        ctx.proxyFunction.callCount++;
    };

    var proxy1 = SProxy.createProxy(function () {}, handler);

    proxy1();
    assert.strictEqual(proxy1.callCount, 1);
    proxy1();
    assert.strictEqual(proxy1.callCount, 2);
 });
