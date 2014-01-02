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

## Storage

By default **object-manage** uses an internal memory storage. However this can
easily be changed to use a storage driver to persist the instance.

### Bundled Drivers

* Memory
* Redis

### Usage

```js
var handle = 'uuid'
var obj = new ObjectManage()
obj.storage({
  driver: 'redis',
  options: {
    host: '127.0.0.1',
    port: 6379,
    secret: 'xyz'
  }
})
obj.restore(handle)
obj.set('foo',1)
obj.save(function(err,handle){
  if(err) throw err
  console.log(handle)
})
```

### Methods

#### Storage Setup

To set the storage driver and options use the setStorage method. This method will
automatically save the current object to the newly set options so data can still
be passed to the constructor. If a string is passed it will be treated as the driver
name and will not pass any options to the driver which assumes default.

```js
var obj = new ObjectManage()
obj.storage('redis') // redis with default options
obj.storage('memory') // revert back to the default
obj.storage({
  driver: 'redis',
  options: {
    host: '127.0.0.1',
    port: 6379,
    secret: 'xyz'
  }
})
```

Storage setup also returns the instance so it can be chained on to the constructor.

```js
var obj = new ObjectManage().storage('redis')
obj.set('foo','yes')
obj.save(function(err){
  if(err) throw err
  process.exit()
})
```

#### Save

Saves the state of the object into the storage driver.

If no handle is set using the `setHandle()` method then a handle
will be automatically generated as a UUID. This handle is made available
to the callback of the save function and will be available through the
`getHandle()` method once the save has been initiated.

```js
var obj = new ObjectManage()
obj.storage('redis')
obj.data.foo = 1
obj.save(function(err,handle,data){
  if(err) throw err
  console.log(handle) //prints the instance id
  console.log(data.foo) //1
})
```

#### Instance Handle

To get the handle used to identify the instance use the getHandle method.
The handle is automatically generated when a new instance is saved and no handle
has been set.

```js
var obj = new ObjectManage()
console.log(obj.getHandle()) //prints the instance handle
```

To set a custom handle used to identify the instance use the setHandle method.

```js
var obj = new ObjectManage()
obj.storage('redis')
obj.setHandle('foo')
obj.set('bar','baz')
obj.save(function(err,handle,data){
  if(err) throw err
  console.log(handle) //foo
  console.log(data.bar) //baz
})
```

#### Restore

To retrieve a saved instance of an object use the restore method.

```js
var handle = 'uuid'
var obj = new ObjectManage().storage('redis')
obj.restore(handle)
```

### Drivers

Implementing user space drivers is simple as well.

Create a driver.

```js
var myStorageDriver = ObjectManage.StorageDriver.create('myStorageDriver')
myStorageDriver.setup = function(options){
  //connect here
}
myStorageDriver.save = function(handle,data,next){
  //save here
  next()
}
myStorageDriver.restore = function(handle,next){
  //restore here
  var data = {} //restored data
  next(null,data)
}
myStorageDriver.flush = function(handle,next){
  //flush here
  next(null)
}
```

Using the driver

```js
var options = {host: '127.0.0.1'}
var obj = new ObjectManage().storage(new myStorageDriver(options))
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

## Validation

In order for object-manage to be useful in more hostile environments.
It allows for validation functions to be defined per instance.

Quick example of a validation function for setting values

```js
var obj = new ObjectManage()
obj.validateSet = function(path,value){
  //your validation code here that calls one of the below functions
  //erroneous method that still processes the action
  this.warn('should have passed a boolean',value)
  //erroneous methods that will halt processing of the action
  this.drop('value must be boolean')
  this.reject('value must be boolean')
  //will throw an exception that must be caught in user space
  this.error('something bad happened')
  //non erroneous return methods
  this.ok(value)
  //or
  return value
}
```

### Callbacks

The following callbacks are available.

* validateGet `ObjectManage.validateGet` -- Validate get directives
* validateSet `ObjectManage.validateSet` -- Validate set directives
* validateExists `ObjectManage.validateExists` -- Validate exists directives
* validateRemove `ObjectManage.validateRemove` -- Validate remove directives
* validateLoad `ObjectManage.validateLoad` -- Validate load directives

### Verbs

There are 5 verbs used to handle exceptions

* **drop** -- Silently drop the set/get operation (returns undefined for get, set returns true)
* **reject** -- Actively reject the set/get operation and issue an error back to the setter/getter
* **warn** -- Accept the get/set request but still issue an error to the user.
* **error** -- Treated like a regular exception and will be thrown upwards.
* **ok** -- Only accepts the value to returned for processing

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

* path -- Path to be set
* value -- Value to be set to the path
* valid -- If a validation function was used this is the validity of that result (boolean)

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
** valid -- If a validation function was used this is the validity of that result (boolean)

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

### Drop

Fired when there is a validation `drop`

* verb -- The current action type (get,set)
* message -- The warning message
* path -- Path of the property being operated on
* value -- The value being operated on

```js
var obj = new require('object-manage')()
obj.on('drop',function(verb,message,path,value){
  console.log('object-manage drop [' + verb + ':' + path + ']: ' + message)
})
obj.validateSet = function(path,value){
  this.drop('not accepting anything')
}
obj.set('foo','will drop') //returns true
```

### Reject

Fired when there is a validation `reject`

* verb -- The current action type (get,set)
* message -- The warning message
* path -- Path of the property being operated on
* value -- The value being operated on

```js
var obj = new require('object-manage')()
obj.on('reject',function(verb,message,path,value){
  console.log('object-manage reject [' + verb + ':' + path + ']: ' + message)
})
obj.validateSet = function(path,value){
  this.reject('not accepting anything')
}
obj.set('foo','will drop') //returns false
```

### Warning

Fired when there is a set/get/merge warning.

* verb -- The current action type (get,set,merge)
* message -- The warning message
* path -- Path of the property being operated on (blank during merge warnings)
* value -- The value being operated on (the value being merged in during a merge warning)

```js
var obj = new require('object-manage')()
obj.on('warn',function(verb,message,path,value){
  console.log('object-manage warning [' + verb + ']: ' + message)
})
obj.load(overlyDeepObject)
```

### Error

Fired when there is a set/get/merge error.

* verb -- The current action type (get,set,merge)
* message -- The warning message
* path -- Path of the property being operated on (blank during merge warnings)
* value -- The value being operated on (the value being merged in during a merge warning)

```js
var obj = new require('object-manage')()
obj.on('error',function(verb,message,path,value){
  console.log('object-manage error [' + verb + ']: ' + message)
})
obj.load(overlyDeepObject)
```

## Changelog

### 0.6.0
* Added support for storage drivers

### 0.5.1
* Fixed small prototype issue with .merge being set to Object instead of ObjectManage

### 0.5.0
* ObjectManage is now an event emitter that fires events for watching data see README for event types
* **object-merge** selected as the default merge package.
* Added switchable merger type based on desired environment.
* Added testing against circular referenced objects
* ObjectManage will not modify objects passed into and are decoupled when using **object-merge**
* ObjectManage.merge prototype function added so the merger can be overridden to allow customised usage.
* Validation now supported on get, set, exists, load, and remove.
* Organized tests into groups for easier future additions.

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
