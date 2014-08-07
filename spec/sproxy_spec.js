
describe("SProxy installation options include", function () {
    it("the SProxy namespace.", function () {
        expect(SProxy).toBeDefined();
        expect(SProxy.createProxy).toBeDefined();
    });

    it("the Object prototype.", function () {
        expect(Object.createProxy).toBeDefined();
    });

    it("a custom object.", function () {
        // Install into a custom object.
        var customContext = {};

        installSProxy(customContext);

        expect(customContext.createProxy).toBeDefined();
    });
});

describe("A simple use case scenario", function () {
    it("consists of a before action, invocation of continue(), and an after action.", function () {
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

        expect(beforeInvocationCount).toBe(1);
        expect(funcInvocationCount).toBe(1);
        expect(afterInvocationCount).toBe(1);

        // Create and test a proxy by invoking createProxy from Object.prototype.
        proxy = func.createProxy(handler);

        proxy();

        expect(beforeInvocationCount).toBe(2);
        expect(funcInvocationCount).toBe(2);
        expect(afterInvocationCount).toBe(2);
    });

    it("passes arguments to the execution context and the target function.", function () {
        var slice = Array.prototype.slice;
        var executionContextArgs;
        var funcArguments;

        var handler = function(executionContext) {
            executionContextArgs = slice.apply(executionContext.arguments);
            executionContext.continue();
        };

        var func = function() {
            funcArguments = slice.apply(arguments);
        };

        var proxy = SProxy.createProxy(func, handler);

        proxy(4, 5, 6);

        expect(executionContextArgs).toBeDefined();
        expect(executionContextArgs.length).toBe(3);
        expect(executionContextArgs).toEqual([4, 5, 6]);

        expect(funcArguments).toBeDefined();
        expect(funcArguments.length).toBe(3);
        expect(funcArguments).toEqual([4, 5, 6]);
    });

    it("returns a value from the target function.", function () {
        var handler = function(executionContext) {
            executionContext.continue();
        };

        var func = function() {
            return 22 + 1;
        };

        var proxy = SProxy.createProxy(func, handler);

        var retValue = proxy();

        expect(retValue).toBe(23);
    });

    it("allows a return value to be overridden by the handler function.", function () {
        var handler = function(executionContext) {
            executionContext.continue();
            executionContext.returnValue = 45;
        };

        var func = function() {
            return 22 + 1;
        };

        var proxy = SProxy.createProxy(func, handler);

        var retValue = proxy();

        expect(retValue).toBe(45);
    });
});

describe("Execution of the target function", function () {
    it("can be cancelled if the handler does not call continue().", function () {
        var targetExecuted,
            func = function () { targetExecuted = true; },
            handler = function (ctx) { targetExecuted = false; };  // Handler does not call continue() which effectively cancels execution of the original function.

        var proxy = SProxy.createProxy(func, handler);

        proxy();

        expect(targetExecuted).toBeDefined();
        expect(targetExecuted).toBe(false);
    });
});

describe("The \"this\" pointer", function () {
    it("references the original object in target methods.", function () {
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

        // Sanity check.
        expect(anObject.WhatIsValue1()).toBe(23);

        // Create using method on SProxy.
        proxyObject = SProxy.createProxy(anObject, handler);

        expect(anObject.WhatIsValue1()).toBe(23);
        expect(anObject.childObject.WhatIsValue1()).toBe(23);
        expect(proxyObject.WhatIsValue1()).toBe(23);
        expect(proxyObject.childObject.WhatIsValue1()).toBe(23);

        // Create using method on object prototype.
        proxyObject = anObject.createProxy(handler);

        expect(anObject.WhatIsValue1()).toBe(23);
        expect(anObject.childObject.WhatIsValue1()).toBe(23);
        expect(proxyObject.WhatIsValue1()).toBe(23);
        expect(proxyObject.childObject.WhatIsValue1()).toBe(23);
    });

    it("references the original object in target methods even when creating multiple proxy layers.", function () {
        var originalObj = {
                method1Called : false,
                method1: function () {
                    this.method1Called = true;

                    expect(this).toBe(originalObj);
                }
            },
            handler = function (ctx) { ctx.continue(); };

        // Create a proxy of a proxy.
        var proxyOfAProxy = originalObj.createProxy(handler).createProxy(handler);

        proxyOfAProxy.method1();

        expect(originalObj.method1Called).toBe(true);
    });

    it("references the original object in a handler function.", function () {
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

                expect(this.numProperty).toBe(23);
            },
            proxy = obj.createProxy(handler);

        proxy.method1();
        proxy.childObject.method1();

        expect(proxy.handlerInvoked).toBe(true);
        expect(proxy.childObject.handlerInvoked).toBe(true);
    });
});

describe("Creating a proxy object", function () {
    it("does not alter the original object.", function () {
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

        expect(obj.method1()).toBe(23);
        expect(proxy.method1()).toBe(45);
    });

    it("will create a proxy method for each one of the original methods.", function () {
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

        expect(obj.method1Called).toBe(true);
        expect(obj.method2Called).toBe(true);
        expect(proxy.method1Called).toBe(true);
        expect(proxy.method2Called).toBe(true);

        expect(onEnterCount).toBe(2);
        expect(onExitCount).toBe(2);

        expect(Object.getPrototypeOf(proxy)).toBe(obj);

        // Create the proxy using createProxy from Object.prototype.
        proxy.method1Called = false;
        proxy.method2Called = false;

        proxy = obj.createProxy(handler);

        proxy.method1();
        proxy.method2();

        expect(obj.method1Called).toBe(true);
        expect(obj.method2Called).toBe(true);
        expect(proxy.method1Called).toBe(true);
        expect(proxy.method2Called).toBe(true);

        expect(onEnterCount).toBe(4);
        expect(onExitCount).toBe(4);

        expect(Object.getPrototypeOf(proxy)).toBe(obj);
    });

    it("will also create a proxy for child objects.", function () {
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

        expect(parentObj.parentMethodCalled).toBe(true);
        expect(parentObj.handlerCalled).toBe(true);
        expect(childObj.childMethodCalled).not.toBeDefined();
        expect(childObj.handlerCalled).not.toBeDefined();

        proxy.childObj.childMethod();

        expect(childObj.childMethodCalled).toBe(true);
        expect(childObj.handlerCalled).toBe(true);
    });
});

describe("Proxy methods can be created conditionally", function () {
    it("based on method names.", function () {
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
        expect(callCount).toBe(1);

        proxy.method2();
        expect(callCount).toBe(1); // A proxy should not have been created for method2 because of the filter.
    });

    it("based on property values.", function () {
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
        expect(callCount).toBe(1);

        proxy.object2.aMethod();
        expect(callCount).toBe(1); // A proxy should not have been created for object2 because of the filter.
    });
});

describe("State can be stored between invocations of a proxy function", function () {
    it("in a state object on the execution context.", function () {
        var expectedCallCount = undefined;
        var proxy = SProxy.createProxy(function () {}, function (ctx) {
            expect(ctx.state.callCount).toBe(expectedCallCount);

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

    it("on the proxy function itself.", function () {
        var handler = function (ctx) {
            expect(ctx.proxyFunction).toBeDefined();

            if (!ctx.proxyFunction.callCount) {
                ctx.proxyFunction.callCount = 0;
            }

            ctx.proxyFunction.callCount++;
        };

        var proxy1 = SProxy.createProxy(function () {}, handler);
        var proxy2 = SProxy.createProxy(function () {}, handler);

        proxy1();
        expect(proxy1.callCount).toBe(1);
        proxy1();
        expect(proxy1.callCount).toBe(2);

        proxy2();
        expect(proxy2.callCount).toBe(1);
        proxy2();
        expect(proxy2.callCount).toBe(2);
    });
});

describe("The execution order of nested proxy functions", function () {
    it("will be maintained based on the nesting order.", function () {
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

        var proxy = func.createProxy(handler1).createProxy(handler2);

        proxy();

        expect(executionOrder).toEqual(["onEnter2", "onEnter1", "onExit1", "onExit2"]);
    });
});
