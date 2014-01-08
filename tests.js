
test("Verify before and after method execution.", function (assert) {
    var beforeInvoked = false;
    var functionInvoked = false;
    var afterInvoked = false;
    
    var before = function() {
        beforeInvoked = true;
    };
    
    var func = function() {
        functionInvoked = true;
    };
    
    var after = function() {
        afterInvoked = true;
    };
    
    var proxy = SProxy.createProxy(func, before, after);
    
    proxy();
    
    assert.equal(beforeInvoked, true, "The before function should have been invoked.");
    assert.equal(functionInvoked, true, "The proxied function should have been invoked.");
    assert.equal(afterInvoked, true, "The after function should have been invoked.");
});

test("Verify correct arguments passed to before, after, and proxied function.", function (assert) {
    var beforeArguments;
    var funcArguments;
    var afterArguments;
    
    var before = function() {
        beforeArguments = arguments;
    };
    
    var func = function() {
        funcArguments = arguments;
    };
    
    var after = function() {
        afterArguments = arguments;
    };
    
    var proxy = SProxy.createProxy(func, before, after);
    
    proxy(4, 5, 6);
    
    var slice = Array.prototype.slice;
    
    assert.ok(beforeArguments, "The before arguments should have a value.");
    assert.equal(beforeArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(beforeArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(funcArguments, "The proxied function arguments should have a value.");
    assert.equal(funcArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(funcArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
    
    assert.ok(afterArguments, "The after arguments should have a value.");
    assert.equal(afterArguments.length, 3, "The number of arguments should be 3.");
    assert.deepEqual(slice.apply(afterArguments), [4, 5, 6], "The arguments should be 4, 5, 6.");
});

test("Verify \"this\" points to the object when creating a proxy for a method and no context is provided.", function (assert) {
    var anObject = {
        value1: 23,
        WhatIsValue1: function() {
           return this.value1;
        }
    };
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");

    anObject.WhatIsValue1 = SProxy.createProxy(anObject.WhatIsValue1, function() {}, function() {}, undefined);
    
    assert.strictEqual(anObject.WhatIsValue1(), 23, "The value for \"value1\" should come from the object and not global.");
});

test("Verify cancellation of executing the proxied function.", function(assert) {
    var cancel = false;
    
    var before = function() {
        return { cancel: cancel, returnValue: 23 };
    };
    
    var func = function() {
        return 45;
    };
    
    var proxy = SProxy.createProxy(func, before);
    
    var retVal = proxy();
    
    assert.equal(retVal, 45, "The \"before\" method should not cancel execution.");
    
    cancel = true;
    retVal = proxy();
    
    assert.equal(retVal, 23, "The \"before\" method should not cancel execution.");
});

