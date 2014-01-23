'use strict';
var ObjectManage = require('../lib/ObjectManage')
  , expect = require('chai').expect
describe('ObjectManage',function(){
  var data1 = {test1: 'val1', test2: 'val2'}
    , data2 = {test3: 'val3', test4: 'val4'}
    , data3 = {test5: {test6: 'val6'}}

  describe('Prototype',function(){
    it('should have a merge function',function(){
      expect(ObjectManage.prototype.hasOwnProperty('merge')).to.equal(true)
      expect(ObjectManage.prototype.merge).to.be.a('function')
    })
  })

  describe('Construction',function(){
    it('should accept data to the constructor',function(){
      var obj = new ObjectManage(data1)
      expect(obj.data.test1).to.equal('val1')
      expect(obj.data.test2).to.equal('val2')
    })
    it('should be able to merge in data after constructing',function(){
      var obj = new ObjectManage(data1,data2)
      expect(obj.data.test3).to.equal('val3')
      expect(obj.data.test4).to.equal('val4')
    })
  })

  describe('Setters and Getters',function(){
    it('should be able to get a nested key',function(){
      var obj = new ObjectManage(data1,data3)
      expect(obj.get('test5.test6')).to.equal('val6')
    })
    it('should be able to set a nested key',function(){
      var obj = new ObjectManage(data1,data3)
      obj.set('test5.test7','val7')
      expect(obj.data.test5.test7).to.equal('val7')
    })
    it('should overwrite a key to object if nested below',function(){
      var obj = new ObjectManage(data1,data2,data3)
      obj.set('test5.test6.new','val8')
      expect(obj.data.test5.test6.new).to.equal('val8')
    })
    it('should returned undefined on a missing key',function(){
      var obj = new ObjectManage(data1)
      expect(obj.get('test5.test6')).to.equal(undefined)
    })
    it('should return a path tree as an array')
  })

  describe('Path Normalization',function(){
    var obj
    beforeEach(function(){
      obj = new ObjectManage(data3)
    })
    it('should allow a period separated string',function(){
      expect(obj.get('test5.test6')).to.equal('val6')
    })
    it('should allow an array of path parts',function(){
      expect(obj.get(['test5','test6'])).to.equal('val6')
    })
    it('should allow a function that returns a path',function(){
      expect(obj.get(function(){return 'test5.test6'})).to.equal('val6')
    })
    it('should allow a function to return an array of path parts',function(){
      expect(obj.get(function(){return ['test5','test6']})).to.equal('val6')
    })
    it('should allow a toString of an object that returns a path',function(){
      expect(obj.get({toString: function(){return 'test5.test6'}})).to.equal('val6')
    })
  })

  describe('Removal and Existence',function(){
    it('should return true if the property exists',function(){
      var obj = new ObjectManage(data1)
      expect(obj.exists('test1')).to.equal(true)
    })
    it('should return false if the property does not exist',function(){
      var obj = new ObjectManage()
      expect(obj.exists('test1')).to.equal(false)
    })
    it('should remove a property and all its children',function(){
      var obj = new ObjectManage(data1,data2,data3)
      obj.remove('test5')
      expect(obj.data.hasOwnProperty('test5')).to.equal(false)
    })
    it('should reset the data object',function(){
      var obj = new ObjectManage(data1,data2,data3)
      obj.reset()
      expect(obj.get('test1')).to.equal(undefined)
    })
  })

  describe('Merging',function(){
    it('should always have an object at .data',function(){
      var obj = new ObjectManage()
      obj.load(undefined)
      expect(obj.data).to.be.an('object')
    })
    it('should return the whole object if no argument if passed to get',function(){
      var obj = new ObjectManage(data1,data2,data3)
      expect(Object.keys(obj.get()).length).to.equal(5)
    })
    it('should merge recursively',function(){
      var obj = new ObjectManage(data3)
      obj.load({test5: {test7: 'val7'}})
      expect(obj.get('test5.test6')).to.equal('val6')
      expect(obj.get('test5.test7')).to.equal('val7')
    })
  })

  describe('Events',function(){
    it('should be able to watch the data object',function(done){
      var obj = new ObjectManage()
      obj.once('load',function(data){
        expect(data.test5.test6).to.equal('val6')
        done()
      })
      obj.load(data3)
    })
    it('should emit a set event',function(done){
      var obj = new ObjectManage()
      obj.once('set',function(path,value){
        expect(path).to.equal('foo')
        expect(value).to.equal('baz')
        done()
      })
      obj.set('foo','baz')
    })
    it('should emit a get event',function(done){
      var obj = new ObjectManage(data1)
      obj.once('get',function(path,value){
        expect(path).to.equal('test1')
        expect(value).to.equal('val1')
        done()
      })
      obj.get('test1')
    })
    it('should emit an exists event',function(done){
      var obj = new ObjectManage(data1)
      obj.once('exists',function(path,exists){
        expect(path).to.equal('foo')
        expect(exists).to.equal(false)
        done()
      })
      obj.exists('foo')
    })
    it('should emit a remove event',function(done){
      var obj = new ObjectManage(data1)
      obj.once('remove',function(path,removed){
        expect(path).to.equal('test1')
        expect(removed).to.equal(true)
        done()
      })
      obj.remove('test1')
    })
    it('should emit a load event',function(done){
      var obj = new ObjectManage()
      obj.once('load',function(data){
        expect(data.test1).to.equal('val1')
        done()
      })
      obj.load(data1)
    })
  })

  describe('Set with Validation',function(){
    it('should validate using drop',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path){
        expect(path).to.equal('test1')
        this.drop(path + ' must be set to val2')
      }
      obj.once('drop',function(verb,message,path,value){
        expect(verb).to.equal('set')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
    })
    it('should validate using reject',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path){
        expect(path).to.equal('test1')
        this.reject(path + ' must be set to val2')
      }
      obj.once('reject',function(verb,message,path,value){
        expect(verb).to.equal('set')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
    })
    it('should validate using warn',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path,value){
        expect(path).to.equal('test1')
        this.warn(path + ' must be set to val2',value)
      }
      obj.once('warn',function(verb,message,path,value){
        expect(verb).to.equal('set')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        expect(obj.get('test1')).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
    })
    it('should validate using error',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path){
        expect(path).to.equal('test1')
        this.error(path + ' must be set to val2')
      }
      obj.once('error',function(verb,message,path,value){
        expect(verb).to.equal('set')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      expect(function(){obj.set('test1','val3')}).to.throw('test1 must be set to val2')
    })
    it('should validate using ok',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path,value){
        expect(path).to.equal('test1')
        this.ok(value)
      }
      obj.once('set',function(path,value){
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        expect(obj.get('test1')).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
    })
    it('should validate using return',function(done){
      var obj = new ObjectManage()
      obj.validateSet = function(path,value){
        expect(path).to.equal('test1')
        return value
      }
      obj.once('set',function(path,value){
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        expect(obj.get('test1')).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
    })
  })

  describe('Get with Validation',function(){
    it('should validate using drop',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path){
        expect(path).to.equal('test1')
        this.drop(path + ' must be set to val2')
      }
      obj.once('drop',function(verb,message,path,value){
        expect(verb).to.equal('get')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
      obj.get('test1')
    })
    it('should validate using reject',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path){
        expect(path).to.equal('test1')
        this.reject(path + ' must be set to val2')
      }
      obj.once('reject',function(verb,message,path,value){
        expect(verb).to.equal('get')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
      obj.get('test1')
    })
    it('should validate using warn',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path,value){
        expect(path).to.equal('test1')
        this.warn(path + ' must be set to val2',value)
      }
      obj.once('warn',function(verb,message,path,value){
        expect(verb).to.equal('get')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
      obj.get('test1')
    })
    it('should validate using error',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path){
        expect(path).to.equal('test1')
        this.error(path + ' must be set to val2')
      }
      obj.once('error',function(verb,message,path,value){
        expect(verb).to.equal('get')
        expect(message).to.equal('test1 must be set to val2')
        expect(path).to.equal('test1')
        expect(value).to.equal('val3')
        done()
      })
      obj.set('test1','val3')
      expect(function(){obj.get('test1')}).to.throw('test1 must be set to val2')
    })
    it('should validate using ok',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path){
        expect(path).to.equal('test1')
        this.ok('val4')
      }
      obj.once('get',function(path,value){
        expect(path).to.equal('test1')
        expect(value).to.equal('val4')
        done()
      })
      obj.set('test1','val3')
      obj.get('test1')
    })
    it('should validate using return',function(done){
      var obj = new ObjectManage()
      obj.validateGet = function(path){
        expect(path).to.equal('test1')
        return 'val4'
      }
      obj.once('get',function(path,value){
        expect(path).to.equal('test1')
        expect(value).to.equal('val4')
        done()
      })
      obj.set('test1','val3')
      obj.get('test1')
    })
  })

  describe('Circular Reference Handling',function(){
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

  describe('Storage Drivers',function(){
    it('should return the instance so the storage method can be chained',function(){
      var obj = new ObjectManage().storage('memory')
      expect(obj).to.be.an.instanceof(ObjectManage)
    })
    it('should allow setting a handle',function(){
      var obj = new ObjectManage().storage('memory')
      obj.setHandle('foo')
      expect(obj.getHandle()).to.equal('foo')
    })
    describe('Memory Driver',function(){
      it('should save with the memory driver',function(done){
        var obj = new ObjectManage()
        obj.set('foo','yes')
        obj.save(function(err,handle,data){
          if(err) throw err
          expect(handle).to.not.equal(null)
          expect(data.foo).to.equal('yes')
          done()
        })
      })
      it('should restore with the memory driver',function(done){
        var obj = new ObjectManage()
        obj.set('foo','yes')
        obj.save(function(err,handle){
          if(err) throw err
          expect(handle).to.not.equal(null)
          //try to restore the object
          var obj2 = new ObjectManage()
          obj2.restore(handle,function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            expect(obj2.get('foo')).to.equal('yes')
            done()
          })
        })
      })
      it('should flush with the memory driver',function(done){
        var obj = new ObjectManage()
        obj.set('foo','yes')
        obj.save(function(err,handle){
          if(err) throw err
          expect(handle).to.not.equal(null)
          //try to restore the object
          var obj2 = new ObjectManage()
          obj2.restore(handle,function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            expect(obj2.get('foo')).to.equal('yes')
            obj2.flush(function(err){
              if(err) throw err
              done()
            })
          })
        })
      })
    })
    describe('Redis Driver',function(done){
      it('should connect with full options',function(){
        var options = {
          driver: 'redis',
          options: {
            host: '127.0.0.1',
            port: 6379
          },
          ready: function(err){
            if(err) throw err
            console.log('redis is ready')
            done()
          }
        }
        new ObjectManage().storage(options)
      })
      it('should save with the redis driver',function(done){
        var obj = new ObjectManage().storage('redis')
        obj.set('foo','yes')
        obj.save(function(err,handle,data){
          if(err) throw err
          expect(handle).to.not.equal(null)
          expect(data.foo).to.equal('yes')
          done()
        })
      })
      it('should restore with the redis driver',function(done){
        var obj = new ObjectManage().storage('redis')
        obj.set('foo','yes')
        obj.save(function(err,handle){
          if(err) throw err
          expect(handle).to.not.equal(null)
          //try to restore the object
          var obj2 = new ObjectManage().storage('redis')
          obj2.restore(handle,function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            expect(obj2.get('foo')).to.equal('yes')
            done()
          })
        })
      })
      it('should flush with the redis driver',function(done){
        var obj = new ObjectManage().storage('redis')
        obj.set('foo','yes')
        obj.save(function(err,handle){
          if(err) throw err
          expect(handle).to.not.equal(null)
          //try to restore the object
          var obj2 = new ObjectManage().storage('redis')
          obj2.restore(handle,function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            expect(obj2.get('foo')).to.equal('yes')
            obj2.flush(function(err){
              if(err) throw err
              done()
            })
          })
        })
      })
    })
    describe('Storage Events',function(){
      it('should emit a generateHandle event',function(done){
        var obj = new ObjectManage()
        obj.once('generateHandle',function(handle){
          expect(handle).to.not.equal(null)
          done()
        })
        obj.generateHandle()
      })
      it('should emit a save event',function(done){
        var obj = new ObjectManage()
        obj.once('save',function(handle,data){
          expect(handle).to.not.equal(null)
          expect(data.foo).to.equal('yes')
          done()
        })
        obj.set('foo','yes')
        obj.save()
      })
      it('should emit a restore event',function(done){
        var obj1 = new ObjectManage()
        obj1.set('foo','yes')
        obj1.save(function(err,handle){
          if(err) throw err
          var obj = new ObjectManage()
          obj.once('restore',function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            done()
          })
          obj.restore(handle)
        })
      })
      it('should emit a flush event',function(done){
        var obj1 = new ObjectManage()
        obj1.set('foo','yes')
        obj1.save(function(err,handle){
          if(err) throw err
          var obj = new ObjectManage()
          obj.once('restore',function(err,data){
            if(err) throw err
            expect(data.foo).to.equal('yes')
            obj.once('flush',function(err){
              if(err) throw err
              done()
            })
            obj.flush()
          })
          obj.restore(handle)
        })
      })
    })
  })
})