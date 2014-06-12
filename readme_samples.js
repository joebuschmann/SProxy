test("README Sample 1: Install SProxy to a custom context", function (assert) {
    // Install into a custom object.
    var customContext = {};
    
    installSProxy(customContext);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the custom context object.");

    // Install into global.
    installSProxy(this);
    
    assert.ok(createProxy, "The method createProxy() should be available from the global object.");
});

test("README Sample 2: Create a simple proxy", function (assert) {
    var func = function () {};
    
    var proxy = SProxy.createProxy(func, function (ctx) {
        console.log("Before func executes...");
        
        // The next line will execute func.
        ctx.continue();
        
        console.log("After func executes...");
    });
    
    proxy();
    
    proxy = func.createProxy(function (ctx) {
        console.log("Before func executes...");
        
        // The next line will execute func.
        ctx.continue();
        
        console.log("After func executes...");
    });
    
    proxy();
    
    expect(0);
});

test("README Sample 3: Modify the return value", function (assert) {
    var func = function () { return -1; };
    
    var proxy = SProxy.createProxy(func, function (ctx) {
        ctx.continue();
        
        if (ctx.returnValue < 0) {
            ctx.returnValue = 0;
        }
    });
    
    var retValue = proxy();
    
    assert.strictEqual(retValue, 0);
});

test("README Sample 4: Proxy an object", function (assert) {
    var obj = { method1: function () {},
                childObject: { method1: function () {} }},
        callCount = 0;
    
    var proxy = obj.createProxy(function (ctx) {
        callCount++;
        ctx.continue();
    });
    
    proxy.method1();
    proxy.childObject.method1();
    
    assert.strictEqual(callCount, 2);
});

test("README Sample 5: Apply a filter", function (assert) {
    var obj = { method1: function () {},
                childObject: { method1: function () {} }},
        callCount = 0,
        handler = function (ctx) {
            callCount++;
            ctx.continue();
        },
        filter = function (propName, propValue) {
            return (typeof (propValue) === "function");
        };
    
    var proxy = obj.createProxy(handler, filter);
    
    proxy.method1();
    proxy.childObject.method1();
    
    assert.strictEqual(callCount, 1);
});

test("README Sample 6: \"this\" points to the object and not global", function (assert) {
    var obj = { 
            method1: function () { this.originalMethodInvoked = true; },
            childObject: {
                method1: function () { this.originalMethodInvoked = true; }
            }
        };
        
    var handler = function (ctx) {
            this.handlerInvoked = true;
            ctx.continue();
        };
    
    var proxy = obj.createProxy(handler);
    
    proxy.method1();
    proxy.childObject.method1();
    
    assert.strictEqual(proxy.originalMethodInvoked, true);
    assert.strictEqual(proxy.childObject.originalMethodInvoked, true);
    assert.strictEqual(proxy.handlerInvoked, true);
    assert.strictEqual(proxy.childObject.handlerInvoked, true);
});
