test("README.md installSProxy Sample 1", function (assert) {
    // Install into a custom object.
    var customContext = {};
    
    installSProxy(customContext);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the custom context object.");

    // Install into global.
    installSProxy(this);
    
    assert.ok(createProxy, "The method createProxy() should be available from the global object.");
});

test("README.md createProxy Sample 1", function (assert) {
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        proxy = SProxy.createProxy(targetFunc, { before: before, after: after, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
});

test("README.md Object.prototype.createProxy Sample 2", function (assert) {
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        
        // createProxy is invoked as a method of the target function.
        proxy = targetFunc.createProxy({ before: before, after: after, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
});

test("README.md createProxy Sample 3", function (assert) {
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
        },
        options = { before: function () { beforeCount++; }, after: function () { afterCount++; } };
    
    proxy = SProxy.createProxy(obj, options);
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(beforeCount, 2, "The before function should have been invoked.");
    assert.strictEqual(afterCount, 2, "The after function should have been invoked.");
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
});

test("README.md Object.prototype.createProxy Sample 4", function (assert) {
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
        },
        options = { before: function () { beforeCount++; }, after: function () { afterCount++; } };
    
    proxy = obj.createProxy(options);
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(beforeCount, 2, "The before function should have been invoked.");
    assert.strictEqual(afterCount, 2, "The after function should have been invoked.");
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
});

