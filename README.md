object-manage
=============

A library for managing javascript objects and offering common getter, setter, merge support.


## Usage

This helper is generally meant to be implemented into higher level API's. As such usage is
simple.

```js

var ObjectManage = require('object-manage')
  , obj = new ObjectManage({box: 'square'})
//load in data
obj.load({foo: 'bar'})
//set a path
obj.set('bas.boo','foo1')
//get a path
obj.get('bas') //{boo: 'foo1'}
obj.get('bas.boo') //'foo1'
//access data directly
console.log(obj.data.bas.boo) //'foo1'

```

## API Reference

### Constructor

The constructor sets up the object to be managed and accepts
the a single argument that gets passed to `ObjectManage.load(data)`

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
var inst = ObjectManage()
inst.load([data1,data2,data3])
```

It can even be a recursive array

```js
inst.load([data1,[data2,data3]])
```

## Set Value

Set will recursively set a path given by a string using dot notation.

```js
var isnt = new ObjectManage()
inst.set('mykey','mydata') //{mykey: 'mydata'}
inst.set('mykey2.data','mydata') //{mykey: 'mydata', mykey2: {data: 'mydata'}}
```

## Get Value

Get will recursively set a path given by a string using dot notation.

```js
var isnt = new ObjectManage({mykey: 'mydata', mykey2: {data: 'mydata'}})
inst.get('mykey') //'mydata'
inst.get('mykey2.data') //'mydata
```