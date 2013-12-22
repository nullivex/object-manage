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
inst.remove('mykey')
inst.exists('mykey.mykey') //false
```

### Check Object Depth

This will take a userspace object and count the depth of the object.

```js
var inst = new ObjectManage()
var obj = {foo: {foo: {foo: 'baz'}}}
obj.countDepth(obj) //3
```

## Changelog

### 0.5.0
* ObjectManage is now an event emitter that fires the `load` event for watching data
* Switched back to `object-merge` which should help on debugging bad objects
* Added testing against circular referenced objects
* ObjectManage will not modify objects passed into and are decoupled

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
