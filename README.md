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
    var proxy = SProxy.createProxy(func, { onEnter: before });
```

What about after?

```Javascript
    var proxy = SProxy.createProxy(func, { onExit: after });
```

What about both?

```Javascript
    var proxy = SProxy.createProxy(func, { onEnter: before, onExit: after });
```

If you want to point `this` to a different context `newContext`, do this:

```Javascript
    var proxy = SProxy.createProxy(func, { onEnter: before, onExit: after, context: newContext });
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

You can create a proxy for an entire object. Each property that holds a function or an object will be proxied.

```Javascript
    // proxy is a new object with all the methods from anObject replaced by a proxy method.
    // anObject is the prototype for proxy and is unchanged.
    var anObject = new AnObject();
    var proxy = SProxy.createProxy(anObject, { onEnter: before, onExit: after });
```

What if you only want to create a proxy for methods and properties that start with the letter "s"?

```Javascript
    var anObject = new AnObject();
    var proxy = SProxy.createProxy(anObject, {
        onEnter: before,
        onExit: after,
        filter: function (propName, propValue) {
            return propName.indexOf("s") === 0;
        }
    });
```

You can also filter using the property value.

```Javascript
    var anObject = new AnObject();
    var proxy = SProxy.createProxy(anObject, {
        onEnter: before,
        onExit: after,
        filter: function (propName, propValue) {
            return propValue && propValue.createProxyForMe;
        }
    });
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
  <dd>Options for creating the proxy. Includes options.onEnter, options.onExit, and options.context.</dd>
  <dt>returns</dt>
  <dd>A proxy function that invokes func according to the values specified by options.</dd>
</dl>


#####Example

```Javascript
    var context = { targetInvoked: false, onEnterInvoked: false, onExitInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        onEnter = function () { this.onEnterInvoked = true; },
        onExit = function () { this.onExitInvoked = true; },
        proxy = SProxy.createProxy(targetFunc, { onEnter: onEnter, onExit: onExit, context: context });
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.onEnterInvoked, "The proxy should execute the onEnter function.");
    assert.ok(context.onExitInvoked, "The proxy should execute the onExit function.");
```

####Syntax 2

    Object.prototype.createProxy(options)

#####Arguments

<dl>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.onEnter, options.onExit, and options.context.</dd>
  <dt>returns</dt>
  <dd>A proxy function that invokes target function according to the values specified by options.</dd>
</dl>


#####Example

```Javascript
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
  <dd>Options for creating the proxy. Includes options.onEnter, options.onExit, and options.context.</dd>
  <dt>returns</dt>
  <dd>A new object that has each method replaced by a proxy method.</dd>
</dl>


#####Example

```Javascript
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
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
```

####Syntax 2

    Object.prototype.createProxy(options)

#####Arguments

<dl>
  <dt>options</dt>
  <dd>Options for creating the proxy. Includes options.onEnter, options.onExit, and options.context.</dd>
  <dt>returns</dt>
  <dd>A new object that has each method replaced by a proxy method.</dd>
</dl>


#####Example

```Javascript
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
    
    assert.strictEqual(proxy.__proto__, obj, "The original object should be the proxy's prototype.");
```

Modifying the Return Value
--------------------------

The execution of a proxied function can be short-circuited by the `onEnter` function. To do so, `onEnter` should return an object with two properties `cancel` and `returnValue`. When `cancel` is true, the proxy immediately returns the value supplied by `returnValue`. Neither the original nor the `after` function will execute.

If execution is not cancelled, then the original and `onExit` functions execute, and the return value is appended to the argument list supplied to `onExit`.

**************

Copyright (c) 2013-2014 Joseph Buschmann. This software is licensed under the MIT License.
