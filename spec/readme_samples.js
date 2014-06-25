
describe("Sample code for the README file:", function () {
    it("README Sample 1: Install SProxy to a custom context", function () {
        // Install into a custom object.
        var customContext = {};

        installSProxy(customContext);

        expect(customContext.createProxy).toBeDefined();

        // Install into global.
        installSProxy(this);

        expect(createProxy).toBeDefined();
    });

    it("README Sample 2: Create a simple proxy", function () {
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
    });

    it("README Sample 3: Modify the return value", function () {
        var func = function () { return -1; };

        var proxy = SProxy.createProxy(func, function (ctx) {
            ctx.continue();

            if (ctx.returnValue < 0) {
                ctx.returnValue = 0;
            }
        });

        var retValue = proxy();

        expect(retValue).toBe(0);
    });

    it("README Sample 4: Proxy an object", function () {
        var obj = { method1: function () {},
                childObject: { method1: function () {} }},
            callCount = 0;

        var proxy = obj.createProxy(function (ctx) {
            callCount++;
            ctx.continue();
        });

        proxy.method1();
        proxy.childObject.method1();

        expect(callCount).toBe(2);
    });

    it("README Sample 5: Apply a filter", function () {
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

        expect(callCount).toBe(1);
    });

    it("README Sample 6: \"this\" points to the object and not global", function () {
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

        expect(proxy.originalMethodInvoked).toBe(true);
        expect(proxy.childObject.originalMethodInvoked).toBe(true);
        expect(proxy.handlerInvoked).toBe(true);
        expect(proxy.childObject.handlerInvoked).toBe(true);
    });

    it("README Sample 7: Storing state between invocations of the handler", function () {
        var func = function () {};
        var callCount = 0;
        var handler = function (ctx) {
            if (!ctx.state.callCount) {
                ctx.state.callCount = 1;
            } else {
                ctx.state.callCount++;
            }

            callCount = ctx.state.callCount;
        };

        var proxy = func.createProxy(handler);

        proxy();
        expect(callCount).toBe(1);

        proxy();
        expect(callCount).toBe(2);

        proxy();
        expect(callCount).toBe(3);
    });

    it("README Sample 8: Accessing the proxy function", function () {
        var func = function () {};
        var handler = function (ctx) {
            if (!ctx.proxyFunction.callCount) {
                ctx.proxyFunction.callCount = 1;
            } else {
                ctx.proxyFunction.callCount++;
            }
        };

        var proxy = func.createProxy(handler);

        proxy();
        expect(proxy.callCount).toBe(1);

        proxy();
        expect(proxy.callCount).toBe(2);

        proxy();
        expect(proxy.callCount).toBe(3);
    });
});
