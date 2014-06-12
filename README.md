SProxy - Simple Proxies
=======================

SProxy is a Javascript library for creating proxies for functions and objects. A proxy can intercept function calls to execute pre-precessing and/or post-processing logic, cancel a function call, and alter a function's return value.

The "S" stands for simple.

Installation
------------

The SProxy logic is contained in the file sproxy.js. The function `installSProxy(ctx)` takes a single context argument and installs the necessary behavior into that context. By default, installation occurs for the object or namespace `SProxy`, but consumers can choose to install it elsewhere such as the global object.

```Javascript
    // Install into a custom object.
    var customContext = {};
    
    installSProxy(customContext);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the custom context object.");

    // Install into global.
    installSProxy(this);
    
    assert.ok(createProxy, "The method createProxy() should be available from the global object.");
```

How SProxy.js Works
-------------------

SProxy.js works by creating a proxy function that combines the original or target function and a handler function. The handler function can add new behavior and/or control access to the target. The handler takes a single argument, an execution context, that provides metadata about the target function and how it is being executed. Most importantly, the execution context exposes a method `continue()` that invokes the target method, and the handler controls access to the target by choosing whether or not to call `continue()`.

Below are the properties exposed by the execution context.

| Property     | Description  |
| :--------    | :----------- |
| continue()   | Calls the target function. |
| returnValue  | Initially undefined, it holds the return value of the target after `continue()` is called and can be modified by the handler. |
| arguments    | The arguments passed to the proxy function.|

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
    
    assert.strictEqual(retValue, 0);
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
    
    assert.strictEqual(callCount, 2);
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
    
    assert.strictEqual(callCount, 1);
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
    
    assert.strictEqual(proxy.originalMethodInvoked, true);
    assert.strictEqual(proxy.childObject.originalMethodInvoked, true);
    assert.strictEqual(proxy.handlerInvoked, true);
    assert.strictEqual(proxy.childObject.handlerInvoked, true);
```


**************

Copyright (c) 2013-2014 Joseph Buschmann. This software is licensed under the MIT License.
