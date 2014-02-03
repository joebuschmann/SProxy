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

Quick Start
-----------

Say you want a function `before` to execute before another function `func`. You can create a proxy to do that:

```Javascript
    var proxy = SProxy.createProxy(func, { before: before });
```

What about after?

```Javascript
    var proxy = SProxy.createProxy(func, { after: after });
```

What about both?

```Javascript
    var proxy = SProxy.createProxy(func, { before: before, after: after });
```

If you want to point `this` to a different context `newContext`, do this:

```Javascript
    var proxy = SProxy.createProxy(func, { before: before, after: after, context: newContext });
```

You can also cancel the invocation of `func` and optionally return a different value.

```Javascript
    var before = function () {
        if (this.state === undefined) {
            // Whoops, state is not defined!
            // Don't bother to continue and return a valid state.
            return { cancel: true, returnValue: { state: open } };
        }
    };
```

Or modify the return value in the `after` function.

```Javascript
    var after = function () {
        var origRetVal = arguments[0];
        
        if (origRetVal === undefined) {
            return { cancel: true, returnValue: { state: open } };
        }
    };
```

You can create a proxy for an entire object.

```Javascript
    // proxy is a new object with all the methods from anObject replaced by a proxy method.
    // anObject is the prototype for proxy and is unchanged.
    var proxy = SProxy.createProxy(anObject, { before: before, after: after });
```

Function Proxies
----------------

A function proxy sandwiches a target function between two functions that provide pre-processing and/or post-processing behavior. At least one is required. In addition, the value of `this` can be changed to point the target function to a different context.

####Syntax 1

    SProxy.createProxy(func, options)

#####Arguments

<dl>
  <dt>func</dt>
  <dd>The target function whose behavior will be modified by the proxy function.</dd>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.before, options.after, and options.context.</dd>
  <dt>returns</dt>
  <dd>A proxy function that invokes func according to the values specified by options.</dd>
</dl>


#####Example

```Javascript
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        proxy = SProxy.createProxy(targetFunc, { before: before, after: after, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
```

####Syntax 2

    Object.prototype.createProxy(options)

#####Arguments

<dl>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.before, options.after, and options.context.</dd>
  <dt>returns</dt>
  <dd>A proxy function that invokes target function according to the values specified by options.</dd>
</dl>


#####Example

```Javascript
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
```

Object Proxies
--------------

An object proxy wraps a target object and replaces each method with a proxy method. The target object is not altered. Instead a new object is created with the original as its prototype. Each proxy method will retain the `this` reference to the target object.

####Syntax 1

    SProxy.createProxyObject(obj, options)

#####Arguments

<dl>
  <dt>obj</dt>
  <dd>A target object that will have each method replaced by a proxy method.</dd>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.before, options.after, and options.context.</dd>
  <dt>returns</dt>
  <dd>A new object that has each method replaced by a proxy method.</dd>
</dl>


#####Example

```Javascript
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
```

####Syntax 2

    Object.prototype.createProxy(options)

#####Arguments

<dl>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.before, options.after, and options.context.</dd>
  <dt>returns</dt>
  <dd>A new object that has each method replaced by a proxy method.</dd>
</dl>


#####Example

```Javascript
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
```

Modifying the Return Value
--------------------------

The execution of a proxied function can be short-circuited by the `before` function. To do so, `before` should return an object with two properties `cancel` and `returnValue`. When `cancel` is true, the proxy immediately returns the value supplied by `returnValue`. Neither the original nor the `after` function will execute.

If execution is not cancelled, then the original and `after` functions execute, and the return value is appended to the argument list supplied to `after`.

**************

Copyright (c) 2013-2014 Joseph Buschmann. This software is licensed under the MIT License.
