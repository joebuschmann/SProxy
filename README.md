SProxy - Simple Proxy Creation
==============================

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
    assert.ok(customContext.createProxyObject, "The method createProxyObject() should be available from the custom context object.");
    
    // Install into global.
    installSProxy(this);
    
    assert.ok(customContext.createProxy, "The method createProxy() should be available from the global object.");
    assert.ok(customContext.createProxyObject, "The method createProxyObject() should be available from the global object.");
```

Quick Start
-----------

Say you want a function `before` to execute before another function `func`. You can create a proxy to do that:

    var proxy = SProxy.createProxy(func, before);

What about after?

    var proxy = SProxy.createProxy(func, undefined, after);

What about both?

    var proxy = SProxy.createProxy(func, before, after);

If you want to point `this` to a different context `newContext`, do this:

    var proxy = SProxy.createProxy(func, before, after, newContext);

You can also cancel the invocation of `func` and optionally return a different value.

    var before = function () {
        if (this.state === undefined) {
            // Whoops, state is not defined!
            // Don't bother to continue and return a valid state.
            return { cancel: true, returnValue: { state: open } };
        }
    };

You can create a proxy for an entire object. A new object will be created with each method replaced by a proxy.

    var proxy = SProxy.createProxyObject(anObject, before, after);

Function Proxies
----------------

A function proxy sandwiches a target function between two functions that provide pre-processing and/or post-processing behavior. At least one is required. In addition, the value of `this` can be changed to point the target function to a different context.

####Syntax 1

    SProxy.createProxy(func, before, after, context)

#####Arguments

<dl>
  <dt>func</dt>
  <dd>The target function whose behavior will be modified by the proxy function.</dd>
  <dt>before</dt>
  <dd>A function that will execute before the target. Optional if after is specified.</dd>
  <dt>after</dt>
  <dd>A function that will execute after the target. Optional if before is specified.</dd>
  <dt>context</dt>
  <dd>An optional object to use for this when executing the proxy function. If not provided, this will revert to the default behavior.</dd>
  <dt>returns</dt>
  <dd>A new function that invokes func, before, and after with this pointed to the provided context.</dd>
</dl>


#####Example

```Javascript
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
```

####Syntax 2

    SProxy.createProxy(dtoArgs)

#####Arguments

<dl>
  <dt>dtoArgs</dt>
  <dd>An object with four properties, func, before, after, and context.</dd>
  <dt>returns</dt>
  <dd>A new function that invokes func, before, and after with this pointed to the provided context.</dd>
</dl>


#####Example

```Javascript
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
```

####Syntax 3

    Object.prototype.createProxy(before, after, context)

#####Arguments

<dl>
  <dt>before</dt>
  <dd>A function that will execute before the target. Optional if after is specified.</dd>
  <dt>after</dt>
  <dd>A function that will execute after the target. Optional if before is specified.</dd>
  <dt>context</dt>
  <dd>An optional object to use for this when executing the proxy function. If not provided, this will revert to the default behavior.</dd>
  <dt>returns</dt>
  <dd>A new function that invokes the target function, before, and after with this pointed to the provided context.</dd>
</dl>


#####Example

```Javascript
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
```

Object Proxies
--------------

An object proxy wraps a target object and replaces each method with a proxy method. The target object is not altered. Instead a new object is created with the original as its prototype. Each proxy method will retain the `this` reference to the target object.

####Syntax 1

    SProxy.createProxyObject(obj, before, after)

#####Arguments

<dl>
  <dt>obj</dt>
  <dd>A target object that will have each method replaced by a proxy method.</dd>
  <dt>before</dt>
  <dd>A function that will execute before the target. Optional if after is specified.</dd>
  <dt>after</dt>
  <dd>A function that will execute after the target. Optional if before is specified.</dd>
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
```

####Syntax 2

    Object.prototype.createProxy(before, after)

#####Arguments

<dl>
  <dt>before</dt>
  <dd>A function that will execute before the target. Optional if after is specified.</dd>
  <dt>after</dt>
  <dd>A function that will execute after the target. Optional if before is specified.</dd>
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
        };
    
    proxy = obj.createProxy(function () { beforeCount++; }, function () { afterCount++; });
    
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
