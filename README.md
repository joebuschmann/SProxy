SProxy - Simple Proxies
=======================

SProxy is a Javascript library that allows you to implement the [proxy object design pattern] (http://en.wikipedia.org/wiki/Proxy_pattern). Proxy objects and functions created with SProxy do not alter the original object or function. Instead the library creates a lightweight wrapper around the target and allows for intercepting calls to execute pre-precessing/post-processing logic, cancelling a function call, or altering a function's return value.

Installation
------------

The SProxy logic is contained in the file sproxy.js. The function `installSProxy(ctx)` takes a single context argument and installs the necessary behavior into that context. By default, installation occurs for the object or namespace `SProxy`, but consumers can choose to install it elsewhere such as the global object.

```Javascript
    // Install into a custom object.
    var customContext = {};

    installSProxy(customContext);

    expect(customContext.createProxy).toBeDefined();

    // Install into global.
    installSProxy(this);

    expect(createProxy).toBeDefined();
```

How SProxy.js Works
-------------------

SProxy.js works by creating a proxy function that combines the original or target function and a handler function. The handler function can add new behavior and/or control access to the target. The handler takes a single argument, an execution context, that provides metadata about the target function and how it is being executed. Most importantly, the execution context exposes a method `continue()` that invokes the target method, and the handler controls access to the target by choosing whether or not to call `continue()`.

Below are the properties exposed by the execution context.

| Property      | Description  |
| :--------     | :----------- |
| continue()    | Calls the target function. |
| returnValue   | Initially undefined, it holds the return value of the target after `continue()` is called and can be modified by the handler. |
| arguments     | The arguments passed to the proxy function.|
| state         | A persistent object (initially empty) used for storing state between handler invocations. |
| proxyFunction | A reference to the proxy function that invoked the handler. |

Quick Start
-----------

If you want to write some messages to the console before and after the execution of an existing function `func`. You can create a proxy to do that.

```Javascript
    var proxy = SProxy.createProxy(func, function (ctx) {
        console.log("Before func executes...");
        
        // The next line will execute func.
        ctx.continue();
        
        console.log("After func executes...");
    });
```

You can also call `createProxy()` as a method of `func`.

```Javascript
    var proxy = func.createProxy(function (ctx) {
        console.log("Before func executes...");
        
        // The next line will execute func.
        ctx.continue();
        
        console.log("After func executes...");
    });
```

To modify the return value, update the value of ctx.returnValue.

```Javascript
    var func = function () { return -1; };

    var proxy = SProxy.createProxy(func, function (ctx) {
        ctx.continue();

        if (ctx.returnValue < 0) {
            ctx.returnValue = 0;
        }
    });

    var retValue = proxy();

    expect(retValue).toBe(0);
```

You can create a proxy for an entire object.

```Javascript
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
```

And conditionally create proxies based on a filter. What if you only want to proxy an object's methods and not its contained objects?

```Javascript
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
```

`this` will always point to the target object when creating a proxy for an object.

```Javascript
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
```

If you need to store state between invocations of a proxy, you can use the `state` property on the execution context.

```Javascript
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
```

You also have access to the proxy function via the `proxyFunction` property.

```Javascript
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
```

**************

Copyright (c) 2013-2014 Joseph Buschmann. This software is licensed under the MIT License.
