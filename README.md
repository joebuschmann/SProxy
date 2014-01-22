SProxy
======

SProxy is a Javascript library for creating proxies for functions and objects. The "S" stands for simple.

Installation
------------

The SProxy logic is contained in the file sproxy.js. The function `installSProxy` takes a single context argument and installs the necessary functions into that context. By default, installation occurs for the object or namespace `SProxy`.

Function Proxies
----------------

A function proxy sandwiches a function between two functions, one of which executes before the target function and provides pre-processing behavior and the other executes after and provides post-processing behavior. At least one is required.

Function proxies can be created in one of three ways. The first is to 
