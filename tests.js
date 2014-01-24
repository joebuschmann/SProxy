
test("Verify before and after method execution.", function (assert) {
    var beforeInvokedCount = 0;
    var functionInvokedCount = 0;
    var afterInvokedCount = 0;
    
    var before = function() {
        beforeInvokedCount++;
    };
    
    var func = function() {
        functionInvokedCount++;
    };
    
    var after = function() {
        afterInvokedCount++;
    };
    
    // Create and test a proxy by passing arguments individually.
    var proxy = SProxy.createProxy(func, before, after);
    
    proxy();
    
    assert.strictEqual(beforeInvokedCount, 1, "The before function should have been invoked one time.");
    assert.strictEqual(functionInvokedCount, 1, "The proxied function should have been invoked one time.");
    assert.strictEqual(afterInvokedCount, 1, "The after function should have been invoked one time.");
    
    // Create and test a proxy by passing arguments as a DTO.
    proxy = SProxy.createProxy({ func: func,
                                 before: before,
                                 after: after });
    
    proxy();
    
    assert.strictEqual(beforeInvokedCount, 2, "The before function should have been invoked two times.");
    assert.strictEqual(functionInvokedCount, 2, "The proxied function should have been invoked two times.");
    assert.strictEqual(afterInvokedCount, 2, "The after function should have been invoked two times.");
    
    // Create and test a proxy by invoking createProxy from Object.prototype.
    proxy = func.createProxy(before, after);
    
    proxy();
    
    assert.strictEqual(beforeInvokedCount, 3, "The before function should have been invoked three times.");
    assert.strictEqual(functionInvokedCount, 3, "The proxied function should have been invoked three times.");
    assert.strictEqual(afterInvokedCount, 3, "The after function should have been invoked three times.");
});

test("Verify correct arguments passed to before, after, and proxied function.", function (assert) {
    var beforeArguments;
    var funcArguments;
    var afterArguments;
    
    var before = function() {
        beforeArguments = arguments;
    };
    
    var func = function() {
        funcArguments = arguments;
    };
    
    var after = function() {
        afterArguments = arguments;
    };
    
    var proxy = SProxy.createProxy(func, before, after);
    
    proxy(4, 5, 6);
    
    var slice = Array.prototype.slice;
    
    assert.ok(beforeArguments, "The before arguments should have a value.");
    assert.strictEqual(beforeArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(beforeArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(funcArguments, "The proxied function arguments should have a value.");
    assert.strictEqual(funcArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(funcArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(afterArguments, "The after arguments should have a value.");
    assert.strictEqual(afterArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(afterArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
});

test("Verify \"this\" points to the correct object when creating a proxy for a method and no context is provided.", function (assert) {
    var anObject = {
        value1: 23,
        WhatIsValue1: function() {
           return this.value1;
        }
    };
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");

    anObject.WhatIsValue1 = SProxy.createProxy(anObject.WhatIsValue1, function () {});
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");
});

test("Verify \"this\" points to the correct context if a custom context is provided.", function (assert) {
    var context = {};
    
    var func = function () {
        this.value1 = 23;
        this.value2 = 45;
    };

    var proxy = SProxy.createProxy(func, function () {}, function () {}, context);
    
    proxy();
    
    assert.strictEqual(context.value1, 23, "The custom context should be altered by the proxy.");
    assert.strictEqual(context.value2, 45, "The custom context should be altered by the proxy.");
    
    var global = (function () { return this; })();
    
    assert.strictEqual(global.value1, undefined, "Value 1 should not exist in the global scope.");
    assert.strictEqual(global.value2, undefined, "Value 2 should not exist in the global scope.");
});

test("Verify cancellation of executing the proxied function.", function(assert) {
    var cancel = false;
    
    var before = function() {
        return { cancel: cancel, returnValue: 23 };
    };
    
    var func = function() {
        return 45;
    };
    
    var proxy = SProxy.createProxy(func, before);
    
    var retVal = proxy();
    
    assert.equal(retVal, 45, "The \"before\" method should not cancel execution.");
    
    cancel = true;
    retVal = proxy();
    
    assert.strictEqual(retVal, 23, "The \"before\" method should not cancel execution.");
});

test("Verify creating a proxy for all methods in an object.", function(assert) {
    var beforeCount = 0,
        afterCount = 0,
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
    
    proxy = SProxy.createProxyObject(obj, function () { beforeCount++; }, function () { afterCount++; });
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(beforeCount, 2, "The before function should have been invoked.");
    assert.strictEqual(afterCount, 2, "The after function should have been invoked.");
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
    
    // Create the proxy using createProxy from Object.prototype.
    proxy = obj.createProxy(function () { beforeCount++; }, function () { afterCount++; });
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(beforeCount, 4, "The before function should have been invoked.");
    assert.strictEqual(afterCount, 4, "The after function should have been invoked.");
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
});

test("Verify creating a proxy doesn't alter the original object.", function (assert) {
    var original = {
        method1: function() {
           return 23;
        }
    };
    
    var before = function() {
        return { cancel: true, returnValue: 45 };
    };
    
    var proxy = SProxy.createProxyObject(original, before);
    
    assert.strictEqual(original.method1(), 23, "The original object should not be altered when creating the proxy.");
    assert.strictEqual(proxy.method1(), 45, "The proxy object should return a different value.");
});

test("Verify the return value isn't passed to the after function when it is undefined.", function (assert) {
    var argCount = 0,
        proxy = SProxy.createProxy({ func: function () {}, after: function () { argCount = arguments.length; }});
    
    proxy(1, 2, 3);
    
    assert.strictEqual(argCount, 3, "Because there is no return value from the proxied function, there should not be an extra argument passed to the \"after\" function.");
});

test("Verify the return value is passed to the after function when it is defined.", function (assert) {
    var argCount = 0,
        lastArg,
        proxy = SProxy.createProxy({ func: function () { return 23; }, after: function () { argCount = arguments.length; lastArg = arguments[argCount - 1]; }});
    
    proxy(1, 2, 3);
    
    assert.strictEqual(argCount, 4, "The return value of the proxied function should be passed to the \"after\" function as the last argument.");
    assert.strictEqual(lastArg, 23, "The return value should have a value of 23.");
});

test("Verify nesting of before and after functions by creating a proxy of a proxy.", function (assert) {
    var executionOrder = [],
        before1 = function () { executionOrder.push("before1"); },
        before2 = function () { executionOrder.push("before2"); },
        after1 = function () { executionOrder.push("after1"); },
        after2 = function () { executionOrder.push("after2"); },
        func = function () {};
    
    var proxy = SProxy.createProxy({ func: func, before: before1, after: after1 });
    proxy = SProxy.createProxy({ func: proxy, before: before2, after: after2 });
    
    proxy();
    
    assert.deepEqual(executionOrder, ["before2", "before1", "after1", "after2"],
                     "The execution order of before and after functions should be before2(), before1(), after1(), after2()."); 
});

test("README.md installSProxy Sample 1", function (assert) {
    // Install into a custom object.
    var customContext = {};
    
    installSProxy(customContext);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the custom context object.");
    assert.ok(customContext.createProxyObject, "The method createProxyObject() should be available from the custom context object.");
    
    // Install into global.
    installSProxy(this);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the global object.");
    assert.ok(customContext.createProxyObject, "The method createProxyObject() should be available from the global object.");
});

test("README.md createProxy Sample 1", function (assert) {
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        
        // Arguments are specified individually.
        proxy = SProxy.createProxy(targetFunc, before, after, context);
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
});

test("README.md createProxy Sample 2", function (assert) {
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        dtoArgs = { func: function () { this.targetInvoked = true; },
                    before: function () { this.beforeInvoked = true; },
                    after: function () { this.afterInvoked = true; },
                    context: context },
        
        // Arguments are provided in a single DTO objects rather than individually.
        proxy = SProxy.createProxy(dtoArgs);
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
});

test("README.md createProxy Sample 3", function (assert) {
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        
        // createProxy is invoked as a method of the target function.
        proxy = targetFunc.createProxy(before, after, context);
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
});

