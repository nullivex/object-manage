'use strict';
var util = require('util')
  , events = require('events')
  , mergeRecursive = require('merge-recursive')
  , objectMerge = require('object-merge')
  , Validate = require('./Validate')
  , ValidateHelpers = require('./ValidateHelpers')
  , StorageDriver = require('./StorageDriver')
  , uuid = require('uuid')

/**
 * Private function to traverse the target and return
 * the path
 * @param target
 * @param path
 * @returns {*}
 */
var get = function(target,path){
  if('object' !== typeof target) return undefined
  if(undefined === path) return target
  var o = target
    , p = path.split('.')
    , i, a
  for(i = 0; o && (a = p[i++]); o = o[a]){
    if(undefined === o[a]) return undefined
  }
  return o
}

/**
 * Private function to traverse the target check if path exists
 * the path
 * @param target
 * @param path
 * @returns {boolean}
 */
var exists = function(target,path){
  if('object' !== typeof target) return false
  var o = target
    , p = path.split('.')
    , i, a
  for(i = 0; o && (a = p[i++]); o = o[a]){
    if(!o.hasOwnProperty(a)) return false
  }
  return true
}

/**
 * Private function traverse the target and set the value
 * to the path
 * @param target
 * @param path
 * @param value
 */
var set = function(target,path,value){
  if('object' === typeof target){
    var o = target
    for(var a,p=path.split('.'),i=0; o&&(a=p[i++]); o=o[a]){
      if(i !== p.length && undefined === o[a]) o[a] = {}
      else if(i !== p.length && 'object' !== typeof o[a]) o[a] = {}
      else if(i === p.length) o[a] = value
    }
  }
}

/**
 * Private function traverse the target and remove the path
 * to the path
 * @param target
 * @param path
 * @returns {boolean}
 */
var remove = function(target,path){
  var o = target
  for(var a,p=path.split('.'),i=0; o&&(a=p[i++]); o=o[a]){
    if(i !== p.length && undefined === o[a]){
      return false
    } else if(i === p.length){
      o[a] = undefined
      delete o[a]
      return true
    }
  }
  return false
}

/**
 * Run validation of an action
 *
 * @param validate  Validation function
 * @param path  Path being evaluated
 * @param value  Value being evaluated
 * @param emit  Callback to emit events
 * @param pre  Callback before emit
 * @param post  Callback after emit for return
 * @returns {*}
 */
var runValidation = function(validate,path,value,emit,pre,post){
  var err = null
    , self = this
  if('string' === typeof emit){
    var event = emit
    emit = function(verb,message,path,value){
      if('ok' === verb || 'warn' === verb){
        self.emit(event,path,value)
      }
      if('ok' !== verb){
        self.emit(verb,event,message,path,value)
      }
    }
  }
  if(!pre) pre = function(verb,value){return value}
  if(!post) post = function(verb,value){return value}
  if('function' !== typeof validate){
    value = pre('ok',value)
    emit('ok','',path,value)
    return post('ok',value)
  } else {
    try {
      value = validate.call(new ValidateHelpers(path,value),path,value)
    } catch(e){
      if(!(e instanceof Validate)){
        throw e
      } else {
        err = e
      }
    }
    if(null === err || 'ok' === err.verb){
      if(null !== err && 'ok' === err.verb) value = err.value
      value = pre('ok',value)
      emit('ok','',path,value)
      return post('ok',value)
    } else if('warn' === err.verb){
      value = pre('warn',value)
      emit('warn',err.message,path,value)
      return post('warn',value)
    } else if('drop' === err.verb){
      emit('drop',err.message,path,value)
      return post('drop',value)
    } else if('reject' === err.verb){
      emit('reject',err.message,path,value)
      return post('reject',value)
    } else {
      emit('error',err.message,path,value)
      throw new Error(err.message)
    }
  }
}

/**
 * Manage constructor passes the initial argument to ObjectManage.load()
 * and accepts the same set of parameters
 * @param data
 * @constructor
 */
var ObjectManage = function(data){
  events.EventEmitter.call(this)
  this.data = {}
  this.load(data)
  //setup the memory driver as the default
  var MemoryDriver = require('../drivers/memory')
  this.driver = new MemoryDriver()
}
util.inherits(ObjectManage,events.EventEmitter)

/**
 * The object to manage
 * @type {{}}
 */
ObjectManage.prototype.data = {}

/**
 * Maximum amount of depth to allow when merging
 * @type {number}
 */
ObjectManage.prototype.maxDepth = 50

/**
 * Reference to the Validate object
 * @type {Function}
 */
ObjectManage.Validate = Validate

/**
 * Set respective path to value
 * @param path
 * @param value
 */
ObjectManage.prototype.set = function(path,value){
  var self = this
  return runValidation.call(
    self,
    self.validateSet,
    path,
    value,
    'set',
    function(verb,value){
      if('ok' === verb || 'warn' === verb || 'drop' === verb){
        set(self.data,path,value)
      }
      return value
    },
    function(verb){
      return ('ok' === verb || 'warn' === verb || 'drop' === verb)
    }
  )
}

/**
 * Validation for set directives
 * @type {null}
 */
ObjectManage.prototype.validateSet = null

/**
 * Get value of path returns undefined if path does not exist
 * @param path
 * @returns {}
 */
ObjectManage.prototype.get = function(path){
  var self = this
  return runValidation.call(
    self,
    self.validateGet,
    path,
    get(self.data,path),
    'get'
  )
}

/**
 * Validation for get directives
 * directly
 * @type {null}
 */
ObjectManage.prototype.validateGet = null

/**
 * Check if path exists (uses hasOwnProperty and is safe to having undefined set as a value)
 * @param path
 * @returns {boolean}
 */
ObjectManage.prototype.exists = function(path){
  var self = this
  return runValidation.call(
    self,
    self.validateExists,
    path,
    null,
    'exists',
    function(verb){
      if('ok' === verb || 'warn' === verb){
        return exists(self.data,path)
      } else {
        return false
      }
    }
  )
}

/**
 * Validation of exists directives
 * @type {null}
 */
ObjectManage.prototype.validateExists = null

/**
 * Remove value and children at desired path (does this by deleting the value)
 * @param path
 * @returns {boolean}
 */
ObjectManage.prototype.remove = function(path){
  var self = this
  return runValidation.call(
    self,
    self.validateRemove,
    path,
    null,
    'remove',
    function(verb,value){
      if('ok' === verb || 'warning' === verb){
        return remove(self.data,path)
      } else {
        return value
      }
    }
  )
}

/**
 * Validation of removal directives
 * @type {null}
 */
ObjectManage.prototype.validateRemove = null

/**
 * Merge arguments into data object
 * Can be an Array or recursive Array of objects that get merged
 * in the order they are passed
 * @param data
 */
ObjectManage.prototype.load = function(data){
  var self = this
  if(util.isArray(data)){
    data.forEach(function(v){
      self.load(v)
    })
  } else {
    if('object' === typeof data){
      var depth = self.countDepth(data)
      if(depth >= self.maxDepth){
        self.emit('warning',self.data,'Object being merged is too deep (' + depth +')')
        console.log('WARN [object-manage]: Object being merged is too deep (' + depth +')')
        console.trace()
      }
      runValidation.call(
        self,
        self.validateLoad,
        null,
        data,
        function(verb,message,path,value){
          if('ok' === verb){
            self.emit('load',value)
          } else {
            self.emit(verb,'load',message,path,value)
          }
        },
        function(verb,value){
          if('ok' === verb || 'warn' === verb){
            self.data = self.merge(self.data,value) || {}
            return self.data
          } else {
            return false
          }
        },
        function(verb){
          return ('ok' === verb || 'warn' === verb)
        }
      )
    }
  }
}

/**
 * Validation for load directives
 * @type {null}
 */
ObjectManage.prototype.validateLoad = null

/**
 * Merge implementation using object-merge
 * @param obj1
 * @param obj2
 * @returns {*|exports}
 */
ObjectManage.prototype.objectMerge = function(obj1,obj2){
  var opts = objectMerge.createOptions({
    depth: this.maxDepth,
    throwOnCircularRef: true
  })
  return objectMerge(opts,obj1,obj2)
}

/**
 * Merge implementation using merge-recursive
 * @param obj1
 * @param obj2
 * @returns {*}
 */
ObjectManage.prototype.mergeRecursive = function(obj1,obj2){
  return mergeRecursive.recursive(obj1,obj2)
}

/**
 * Merge prototype allowed to be overirden
 * @param obj1
 * @param obj2
 * @returns {*|exports}
 */
ObjectManage.prototype.merge = ObjectManage.prototype.objectMerge

/**
 * Count the depth of an object and return
 * @param object  Target object
 * @param count  Used for recursion only
 * @returns {Number}
 */
ObjectManage.prototype.countDepth = function(object,count){
  if(undefined === count) count = 1
  for(var key in object) {
    if (!object.hasOwnProperty(key)) continue
    if('object' === typeof object[key]){
      var newCount = this.countDepth(object[key],(count + 1))
      if(newCount > this.maxDepth) return this.maxDepth
      count = Math.max(newCount,count)
    }
  }
  return count
}

/**
 * Instance of the storage backend
 * @type {null}
 */
ObjectManage.prototype.driver = null

/**
 * Setup the storage backend
 * @param driver
 */
ObjectManage.prototype.storage = function(driver){
  var Driver
  if(driver instanceof StorageDriver){
    this.driver = driver
  } else if('string' === typeof driver){
    Driver = require('../drivers/' + driver)
    this.driver = new Driver()
  } else if('object' === typeof driver){
    Driver = require('../drivers/' + driver.driver)
    this.driver = new Driver(driver.options)
  }
  return this
}

/**
 * Reference to the storage driver class
 * @type {exports}
 */
ObjectManage.StorageDriver = require('./StorageDriver')

/**
 * Instance handle
 * @type {null}
 */
ObjectManage.prototype.handle = null

/**
 * Generate Instance Handle if not already set
 */
ObjectManage.prototype.generateHandle = function(){
  if(null === this.handle){
    var handle = uuid.v4()
    this.setHandle(handle)
    this.emit('generateHandle',handle)
  }
}

/**
 * Set instance handle explicitly
 * @param handle
 */
ObjectManage.prototype.setHandle = function(handle){
  this.handle = handle
}

/**
 * Return the instance handle that is currently set
 * will be null if not yet generated
 * @returns {null}
 */
ObjectManage.prototype.getHandle = function(){
  return this.handle
}

/**
 * Save to the storage backend
 * Callback params: err, handle, data
 * @param [cb]
 */
ObjectManage.prototype.save = function(cb){
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  var self = this
  self.generateHandle()
  if('function' === typeof self.driver.save){
    self.driver.save(self.handle,self.data,function(err){
      self.emit('save',self.handle,self.data)
      cb(err,self.handle,self.data)
    })
  } else {
    var err = 'driver (' + self.driver.name + ') has not implemented a save method'
    self.emit('save',err)
    cb(err)
  }
}

/**
 * Restore frozen object by its handle
 * @param handle
 * @param [cb]
 */
ObjectManage.prototype.restore = function(handle,cb){
  var self = this
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  self.setHandle(handle)
  if('function' === typeof self.driver.restore){
    self.driver.restore(self.handle,function(err,data){
      if(err){
        self.emit('restore',err)
        cb(err)
      } else {
        self.load(data)
        self.emit('restore',null,data)
        cb(null,data)
      }
    })
  } else {
    var err = 'driver (' + self.driver.name + ') has not implemented a restore method'
    self.emit('restore',err)
    cb(err)
  }
}

/**
 * Flush the object stored by the storage driver
 * @param [cb]
 */
ObjectManage.prototype.flush = function(cb){
  var self = this
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  if(null === self.handle){
    throw new Error('cannot flush without a handle being set')
  } else if('function' === typeof self.driver.flush){
    self.driver.flush(self.handle,function(err){
      if(err){
        self.emit('flush',err)
        cb(err)
      } else {
        self.emit('flush')
        self.data = {}
        cb()
      }

    })
  } else {
    var err = 'driver (' + self.driver.name + ') has not implemented a flush method'
    self.emit('flush',err)
    cb(err)
  }
}

module.exports = ObjectManage