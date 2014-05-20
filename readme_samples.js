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
    var context = { targetInvoked: false, onEnterInvoked: false, onExitInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        onEnter = function () { this.onEnterInvoked = true; },
        onExit = function () { this.onExitInvoked = true; },
        proxy = SProxy.createProxy(targetFunc, { onEnter: onEnter, onExit: onExit, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.onEnterInvoked, "The proxy should execute the onEnter function.");
    assert.ok(context.onExitInvoked, "The proxy should execute the onExit function.");
});

test("README.md Object.prototype.createProxy Sample 2", function (assert) {
    var context = { targetInvoked: false, onEnterInvoked: false, onExitInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        onEnter = function () { this.onEnterInvoked = true; },
        onExit = function () { this.onExitInvoked = true; },
        
        // createProxy is invoked as a method of the target function.
        proxy = targetFunc.createProxy({ onEnter: onEnter, onExit: onExit, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.onEnterInvoked, "The proxy should execute the onEnter function.");
    assert.ok(context.onExitInvoked, "The proxy should execute the onExit function.");
});

test("README.md createProxy Sample 3", function (assert) {
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
        options = { onEnter: function () { onEnterCount++; }, onExit: function () { onExitCount++; } };
    
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
});

test("README.md Object.prototype.createProxy Sample 4", function (assert) {
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
        options = { onEnter: function () { onEnterCount++; }, onExit: function () { onExitCount++; } };
    
    proxy = obj.createProxy(options);
    
    proxy.method1();
    proxy.method2();
    
    assert.ok(obj.method1Called, "The original object should be the context for the proxy object.");
    assert.ok(obj.method2Called, "The original object should be the context for the proxy object.");
    assert.ok(proxy.method1Called, "Properties of the original object should be accessable through the proxy.");
    assert.ok(proxy.method2Called, "Properties of the original object should be accessable through the proxy.");
    
    assert.strictEqual(onEnterCount, 2, "The onEnter function should have been invoked.");
    assert.strictEqual(onExitCount, 2, "The onExit function should have been invoked.");
    
    assert.strictEqual(Object.getPrototypeOf(proxy), obj, "The original object should be the proxy's prototype.");
});

