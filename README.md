object-manage [![Build Status](https://travis-ci.org/snailjs/object-manage.png?branch=master)](https://travis-ci.org/snailjs/object-manage)
=============

A library for managing javascript objects and offering common getter, setter, merge support.

Works great for managing config objects and libraries that have options.

## Installation

```
$ npm install object-manage
```

## Usage

This helper is generally meant to be implemented into higher level API's. As such usage is
simple.

ObjectManage is also an event emitter that allows the internal data object to be watched
and augmented manually.

```js
var ObjectManage = require('object-manage')

//construct
var obj = new ObjectManage({box: 'square'})

//watch data
var mydata = {}
obj.on('load',function(data){
  mydata = data
})

//load in data
obj.load({foo: 'bar'})

//set a path
obj.set('bas.boo','foo1')

//get a path
obj.get('bas') //{boo: 'foo1'}
obj.get('bas.boo') //'foo1'

//access data directly
console.log(obj.data.bas.boo) //'foo1'

//check if a path exists
obj.exists('bas') //true
obj.exists('badkey') //false

//remove a path
obj.remove('bas')
obj.exists('bas') //false

```

## Inheritance

It is also useful to use ObjectManage as a superconstructor for libraries with options.

Here is a quick example

```js
var ObjectManage = require('object-manage')
  , util = require('util')

var myObj = function(data){
  ObjectManage.call(this,data)
}
util.inherits(myObj,ObjectManage)

myObj.prototype.foo = function(){
  console.log(this.data) //this.data managed by ObjectManage
}
```

## Switching Merge Package

In order to make object-manage more performance friendly in smaller environments
the merger can easily be switched between **object-merge** for **merge-recursive**.
**merge-recursive** will only merge pointers and thus when the object-manage instance
is modified the original objects will be as well. We choose **object-merge** as the
default because it will decouple from the objects being merged in. This comes with a
performance and memory cost.

To use **merge-recursive**

```js
var ObjectManage = require('object-manage')
ObjectManage.prototype.merge = ObjectManage.prototype.mergeRecursive
```

It is also possible to implement one's own merging function.

```js
var ObjectManage = require('object-manage')
ObjectManage.prototype.merge = function(obj1,obj2){
  var mergedObject = obj2
  return mergedObject
}
```

## API Reference

### Constructor

The constructor sets up the object to be managed and accepts
the a single argument that gets passed to `ObjectManage.load(data)`

```js
var data = {foo: 'foo'}
var inst = new ObjectManage(data)
```

**NOTE** If watching data via the `load` event is desired data
should not be passed to the construct as it will be impossible to
listen for the `load` event.

### Load Object(s)

Load is used to merge an argument object into the main object.

```js
var inst = new ObjectManage()
inst.load({mykey: 'mydata'})
inst.load({mykey2: 'mydata2'})
```

Load will also accept an array of objects that will
be merged on top of each other in order.

```js
var data1 = {test1: 'val1', test2: 'val2'}
  , data2 = {test3: 'val3', test4: 'val4'}
  , data3 = {test5: {test6: 'val6'}}
var inst = new ObjectManage()
inst.load([data1,data2,data3])
```

It can even be a recursive array

```js
inst.load([data1,[data2,data3]])
```

### Set Value

Set will recursively set a path given by a string using dot notation.

```js
var isnt = new ObjectManage()
inst.set('mykey','mydata') //{mykey: 'mydata'}
inst.set('mykey2.data','mydata') //{mykey: 'mydata', mykey2: {data: 'mydata'}}
```

### Set Validate

When set is called if a set validate function is defined it will be called to
check the validity of the value being set.

```js
var inst = new ObjectManage()
inst.setValidate = function(path,value){
  if('foo' === path) return true
  else return false
}
inst.set('foo','yes') //true
inst.get('foo') //yes
inst.set('bar') //false
inst.get('bar') //undefined
```

### Get Value

Get will recursively set a path given by a string using dot notation.

```js
var isnt = new ObjectManage({mykey: 'mydata', mykey2: {data: 'mydata'}})
inst.get('mykey') //'mydata'
inst.get('mykey2.data') //'mydata
```

### Path Exists

Check if a path exists

**NOTE** This uses `hasOwnProperty()` method of the object so is safe
to return an accurate value even when a path is set to `undefined`

```js
var inst = new ObjectManage({mykey: 'myvalue'})
inst.exists('mykey') //true
inst.exists('mykey2') //false
```

### Remove a Path

Remove a path and all its children

This uses `delete object[property]` and does not just set the property
to `undefined`

```js
var inst = new ObjectManage({mykey: {mykey2: 'myvalue'}})
inst.exists('mykey.mykey2') //true
inst.remove('mykey') //true
inst.exists('mykey.mykey') //false
```

### Check Object Depth

This will take a userspace object and count the depth of the object.

```js
var inst = new ObjectManage()
var obj = {foo: {foo: {foo: 'baz'}}}
obj.countDepth(obj) //3
```

## Events

### Set

Fired when a set is processed on the managed object

** path -- Path to be set
** value -- Value to be set to the path
** valid -- If a validation function was used this is the validity of that result (boolean)

```js
var obj = new require('object-manage')()
obj.on('set',function(path,value,valid){
  valid = valid ? 'valid' : 'invalid'
  console.log('a ' + valid + ' value of (' + value + ') set to (' + path + ')')
})
obj.set('foo','bar')
```

### Get

Fired when a get is processed on the managed object

* path -- Path to be retrieved
* value -- Value of the path retrieved

```js
var obj = new require('object-manage')()
obj.on('get',function(path,value){
  console.log(value + ' was retrieved from ' + path)
})
obj.get('foo')
```

### Exists

Fired when an exists operation is performed

* path -- Path that is being checked for existance
* exists -- Result of exists check (boolean)

```js
var obj = new require('object-manage')()
obj.on('exists',function(path,exists){
  var does = exists ? 'does' : 'does not'
  console.log('checked if ' + path + ' exists and it ' + does)
})
obj.exists('foo')
```

### Remove

Fired when an remove operation is performed

* path -- Path that is being checked for existance
* removed -- Result of removal operation (boolean)

```js
var obj = new require('object-manage')()
obj.on('exists',function(path,removed){
  var successfully = removed ? 'successfully' : 'unsuccessfully'
  console.log(successfully + ' removed path (' + path + ')')
})
obj.remove('foo')
```

### Load

Fired when a load and merge is performed on the managed object

* data -- Result of the load and merge

```js
var obj = new require('object-manage')()
obj.on('load',function(data){
  console.log('a merge was performed and the resulting data: ' + data)
})
obj.load({foo: 'bar'})
```

### Warning

Currently only fired when a merge is deeper than the maxDepth setting.

* data -- The data object in use at the time of the warning
* message -- The warning message that was thrown

```js
var obj = new require('object-manage')()
obj.on('warning',function(data,message){
  console.log('object-manage warning: ' + message)
})
obj.load(overlyDeepObject)
```

## Changelog

### 0.5.0
* ObjectManage is now an event emitter that fires events for watching data see README for event types
* **object-merge** selected as the default merge package.
* Added switchable merger type based on desired environment.
* Added testing against circular referenced objects
* ObjectManage will not modify objects passed into and are decoupled
* ObjectManage.merge prototype function added so the merger can be overridden to allow customised usage.
* ObjectManage.setValidate can be used to validate set calls with a user space function.

### 0.4.0
* Added max depth warning for recursive objects that would normally throw `Maximum call stack exceeded`
* Added extensive testing against object size testing and warnings
* Even if maxDepth is exceeded the merge will still be attempted but is likely to fail with a
`Maximum call stack exceeded` error
* Max depth is adjustable using the `ObjectManage.maxDepth` property
* Added `ObjectManage.countDepth(object)` to check object depth
* Changed merging package to [merge-recursive](https://github.com/UmbraEngineering/node-merge-recursive) this
will now maintain associations to parent objects so that libraries can establish a pointer to the managed object
eg: `var obj = new ObjectManage(); var watched = obj.data`

### 0.3.0
* No argument to `get()` now returns the entire object
* Testing added against recursive merging

### 0.2.3
* Small fix to make sure `ObjectManage.data` is always an object

### 0.2.2
* Changed from **merge** to **object-merge** to allow for recursive merging
* Made private functions more robust to non-sane input

### 0.2.1
* Updated package.json

### 0.2.0
* Added `ObjectManage.exists()`
* Added `ObjectManage.remove()`

### 0.1.0
* Initial Release

## License

MIT licensed see `LICENSE.md`
