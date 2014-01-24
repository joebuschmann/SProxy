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

####Syntax

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
  <dd>An optional object to use for this when executing the proxy function.</dd>
</dl>


#####Example

```Javascript
    var context = { targetInvoked: false, beforeInvoked: false, afterInvoked: false },
        targetFunc = function () { this.targetInvoked = true; },
        before = function () { this.beforeInvoked = true; },
        after = function () { this.afterInvoked = true; },
        proxy = SProxy.createProxy(targetFunc, before, after, context);
        
    proxy();
    
    assert.ok(context.targetInvoked, "The proxy should execute the target function.");
    assert.ok(context.beforeInvoked, "The proxy should execute the before function.");
    assert.ok(context.afterInvoked, "The proxy should execute the after function.");
```


####Object.prototype.createProxy()
