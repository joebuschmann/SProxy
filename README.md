SProxy
======

SProxy is a Javascript library for creating proxies for functions and objects. A proxy can intercept function calls to execute pre-precessing and/or post-processing logic, cancel a function call, and alter a function's return value.

The "S" stands for simple.

Installation
------------

The SProxy logic is contained in the file sproxy.js. The function `installSProxy(ctx)` takes a single context argument and installs the necessary behavior into that context. By default, installation occurs for the object or namespace `SProxy`, but consumers can choose to install it elsewhere such as the global object.

Function Proxies
----------------

A function proxy sandwiches a target function between two functions that provide pre-processing and/or post-processing behavior. At least one is required. In addition, the value of `this` can be changed to point the target function to a different context.

Function proxies can be created in one of two ways.

####SProxy.createProxy()

The SProxy namespace exposes the function `createProxy()` with two overloads. The first takes four arguments.

```Javascript
var context = { targetInvoked = false, beforeInvoked: false, afterInvoked: false },
    targetFunc = function () { context.targetInvoked = true; },
    before = function () { context.beforeInvoked = true; },
    after = function () { context.afterInvoked = true; },
    proxy = SProxy.createProxy(func, before, after, context);
    
proxy();

assert.ok(context.targetInvoked, "The proxy should execute the target function.");
assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
assert.ok(context.afterInvoked, "The proxy should execute the after function.");
```


####Object.prototype.createProxy()
