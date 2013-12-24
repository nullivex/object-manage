'use strict';
var ObjectManage = require('../lib/ObjectManage')
  , expect = require('chai').expect
describe('ObjectManage',function(){
  var data1 = {test1: 'val1', test2: 'val2'}
    , data2 = {test3: 'val3', test4: 'val4'}
    , data3 = {test5: {test6: 'val6'}}
  it('should accept data to the constructor',function(){
    var obj = new ObjectManage(data1)
    expect(obj.data.test1).to.equal('val1')
    expect(obj.data.test2).to.equal('val2')
  })
  it('should be able to merge in data after constructing',function(){
    var obj = new ObjectManage([data1,data2])
    expect(obj.data.test3).to.equal('val3')
    expect(obj.data.test4).to.equal('val4')
  })
  it('should be able to get a nested key',function(){
    var obj = new ObjectManage([data1,data3])
    expect(obj.get('test5.test6')).to.equal('val6')
  })
  it('should be able to set a nested key',function(){
    var obj = new ObjectManage([data1,data3])
    obj.set('test5.test7','val7')
    expect(obj.data.test5.test7).to.equal('val7')
  })
  it('should overwrite a key to object if nested below',function(){
    var obj = new ObjectManage([data1,data2,data3])
    obj.set('test5.test6.new','val8')
    expect(obj.data.test5.test6.new).to.equal('val8')
  })
  it('should returned undefined on a missing key',function(){
    var obj = new ObjectManage(data1)
    expect(obj.get('test5.test6')).to.equal(undefined)
  })
  it('should return true if the property exists',function(){
    var obj = new ObjectManage(data1)
    expect(obj.exists('test1')).to.equal(true)
  })
  it('should return false if the property does not exist',function(){
    var obj = new ObjectManage()
    expect(obj.exists('test1')).to.equal(false)
  })
  it('should remove a property and all its children',function(){
    var obj = new ObjectManage([data1,data2,data3])
    obj.remove('test5')
    expect(obj.data.hasOwnProperty('test5')).to.equal(false)
  })
  it('should always have an object at .data',function(){
    var obj = new ObjectManage()
    obj.load(undefined)
    expect(obj.data).to.be.an('object')
  })
  it('should return the whole object if no argument if passed to get',function(){
    var obj = new ObjectManage([data1,data2,data3])
    expect(Object.keys(obj.get()).length).to.equal(5)
  })
  it('should merge recursively',function(){
    var obj = new ObjectManage(data3)
    obj.load({test5: {test7: 'val7'}})
    expect(obj.get('test5.test6')).to.equal('val6')
    expect(obj.get('test5.test7')).to.equal('val7')
  })
  it('should be able to watch the data object',function(done){
    var obj = new ObjectManage()
    obj.once('load',function(data){
      expect(data.test5.test6).to.equal('val6')
      done()
    })
    obj.load(data3)
  })
  it('should fail on circular referenced objects',function(){
    var x = {
      'a' : function () {return null}
    }
    x.b = x.a
    var obj = new ObjectManage()
    function load(){
      obj.load(x)
    }
    expect(load).to.throw(Error)
  })
  it('should work using merge-recursive',function(){
    var obj = new ObjectManage()
    obj.merge = ObjectManage.prototype.mergeRecursive
    obj.load(data1)
    obj.load(data3)
    expect(obj.get('test5.test6')).to.equal('val6')
  })
  it('should count object depth accurately',function(){
    var testObject = {foo: {foo: {foo: 'baz'}}}
      , obj = new ObjectManage()
    expect(obj.countDepth(testObject)).to.equal(3)
  })
  it('should warn on objects more than 50 levels deep',function(){
    //setup console mocking
    var oldLog = console.log
      , oldTrace = console.trace
      , log = []
      , traced = false
    console.log = function(msg){
      log.push(msg)
    }
    console.trace = function(){
      traced = true
    }
    var buildObject = function(object,depth,count){
      if(undefined === object) object = {}
      if(undefined === count) count = 1
      if(undefined === depth) depth = 100
      if(count > depth) return object
      object[count] = buildObject(object[count],depth,(count + 1))
      return object
    }
    //var obj = new ObjectManage()
    var badObject = buildObject()
      , obj = new ObjectManage()
    //verify the limiter on depth is working
    expect(obj.countDepth(badObject)).to.equal(obj.maxDepth)
    //verify that we can adjust the maxDepth
    var oldMaxDepth = obj.maxDepth
    obj.maxDepth = 20
    expect(obj.countDepth(badObject)).to.equal(20)
    //restore original
    obj.maxDepth = oldMaxDepth
    //load the bad object which should puke
    obj.load(badObject)
    //verify the warning was thrown
    expect(log[0]).to.equal('WARN [object-manage]: Object being merged is too deep (50)')
    expect(traced).to.equal(true)
    //cleanup
    log = []
    traced = false
    //set the max depth to a lower value and try again
    obj.maxDepth = 10
    //load the bad object which should puke
    obj.load(badObject)
    expect(log[0]).to.equal('WARN [object-manage]: Object being merged is too deep (10)')
    expect(traced).to.equal(true)
    //restore native console functions
    console.log = oldLog
    console.trace = oldTrace
  })
})