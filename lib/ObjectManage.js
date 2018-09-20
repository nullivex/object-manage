'use strict';
var EventEmitter = require('events').EventEmitter
var uuid = require('uuid')

var objectMerge = require('object-merge')

var Validate = require('./Validate')
var ValidateHelpers = require('./ValidateHelpers')
var StorageDriver = require('./StorageDriver')


/**
 * Count depth of an object
 * @param {object} object
 * @param {number} maxDepth
 * @return {number}
 */
var countDepth = function(object,maxDepth) {
  if(!maxDepth) maxDepth = 50
  var level = 1
  var key
  for(key in object) {
    if (!object.hasOwnProperty(key)) continue
    if('object' === typeof object[key]){
      var depth = countDepth(object[key],maxDepth) + 1
      level = Math.max(depth, level)
      if(level > maxDepth) return maxDepth
    }
  }
  return level
}


/**
 * Take a path argument and normalize to something usable
 * from multiple types
 * @param {*} path
 * @return {*}
 */
var pathNormalize = function(path){
  if(undefined === path){
    throw new Error('path is required')
  }
  if(path instanceof Array){
    return path.join('.')
  }
  if('function' === typeof path){
    return pathNormalize(path())
  }
  if('object' === typeof path && 'string' !== typeof path && 'function' === typeof path.toString){
    return path.toString()
  }
  return path
}


/**
 * Private function to traverse the target and return
 * the path
 * @param {object} target
 * @param {*} path
 * @return {*}
 */
var get = function(target,path){
  if('object' !== typeof target) return undefined
  if(undefined === path) return target
  path = pathNormalize(path)
  var o = target
  var p = path.split('.')
    , i, a
  for(i = 0; o && (a = p[i++]); o = o[a]){
    if(undefined === o[a]) return undefined
  }
  return o
}


/**
 * Private function to traverse the target check if path exists
 * the path
 * @param {object} target
 * @param {*} path
 * @return {boolean}
 */
var exists = function(target,path){
  if('object' !== typeof target) return false
  path = pathNormalize(path)
  var o = target
  var p = path.split('.')
  var i, a
  for(i = 0; o && (a = p[i++]); o = o[a]){
    if(!o.hasOwnProperty(a)) return false
  }
  return true
}


/**
 * Private function traverse the target and set the value
 * to the path
 * @param {object} target
 * @param {*} path
 * @param {*} value
 */
var set = function(target,path,value){
  path = pathNormalize(path)
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
 * @param {object} target
 * @param {*} path
 * @return {boolean}
 */
var remove = function(target,path){
  path = pathNormalize(path)
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
 * Walk the object and return an array of the paths
 * @param {object} obj
 * @return {Array}
 */
var walkTree = function(obj){
  var keys = [];
  for(var key in obj){
    if(!obj.hasOwnProperty(key)) continue
    keys.push(key)
    if('object' === typeof obj[key]){
      var subKeys = walkTree(obj[key])
      for(var i = 0; i < subKeys.length; i++){
        keys.push(key + '.' + subKeys[i])
      }
    }
  }
  return keys
}


/**
 * Flush all the values out of the object
 * @param {object} obj
 * @return {ObjectManage}
 */
var flush = function(obj){
  for(var i in obj){
    //skip prototypes
    if(!obj.hasOwnProperty(i)) continue
    //skip internals
    if(i.match(/^\$/)) continue
    //delete the rest
    delete obj[i]
  }
  return obj
}


/**
 * Strip all the extensions and only return the data
 * @param {object} obj
 * @return {*}
 */
var strip = function(obj){
  var rv = {}
  for(var i in obj){
    //skip prototypes
    if(!obj.hasOwnProperty(i)) continue
    //skip internals
    if(i.match(/^\$/)) continue
    //keep the rest
    rv[i] = obj[i]
  }
  return rv
}


/**
 * Extract all the extensions and return them (inverse of strip)
 * @param {object} obj
 * @return {*}
 */
var extract = function(obj){
  var rv = {}
  for(var i in obj){
    //skip prototypes
    if(!obj.hasOwnProperty(i)) continue
    //skip internals
    if(!i.match(/^\$/)) continue
    //keep the rest
    rv[i] = obj[i]
  }
  return rv
}


/**
 * Run validation of an action
 *
 * @param {function} validate  Validation function
 * @param {string} path  Path being evaluated
 * @param {*} value  Value being evaluated
 * @param {ObjectManage.$e} emit  Callback to emit events
 * @param {function} pre  Callback before emit
 * @param {function} post  Callback after emit for return
 * @this runValidation
 * @return {*}
 */
var runValidation = function(validate,path,value,emit,pre,post){
  var err = null
  var that = this
  if('string' === typeof emit){
    var event = emit
    emit = function(verb,message,path,value){
      if('ok' === verb || 'warn' === verb){
        that.$e.emit(event,path,value)
      }
      if('ok' !== verb){
        that.$e.emit(verb,event,message,path,value)
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
 * Takes any number of Objects to be loaded and merged at call time
 * @constructor
 */
var ObjectManage = function(){
  this.$e = new EventEmitter()
  //send any arguments to be merged into the main data object
  this.$load.apply(this,arguments)
  //setup the memory driver as the default
  var MemoryDriver = require('../drivers/memory')
  this.$driver = new MemoryDriver()
}


/**
 * Maximum amount of depth to allow when merging
 * @type {number}
 */
ObjectManage.prototype.$maxDepth = 50


/**
 * Reference to the Validate object
 * @type {Function}
 */
ObjectManage.$Validate = Validate


/**
 * Set respective path to value
 * @param {*} path
 * @param {*} value
 * @return {*}
 */
ObjectManage.prototype.$set = function(path,value){
  var that = this
  return runValidation.call(
    that,
    that.$validateSet,
    path,
    value,
    'set',
    function(verb,value){
      if('ok' === verb || 'warn' === verb || 'drop' === verb){
        set(that,path,value)
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
ObjectManage.prototype.$validateSet = null


/**
 * Get value of path returns undefined if path does not exist
 * @param {*} path
 * @return {*}
 */
ObjectManage.prototype.$get = function(path){
  var that = this
  return runValidation.call(
    that,
    that.$validateGet,
    path,
    get(strip(that),path),
    'get'
  )
}


/**
 * Validation for get directives
 * directly
 * @type {null}
 */
ObjectManage.prototype.$validateGet = null


/**
 * Check if path exists (uses hasOwnProperty and is safe to having undefined set as a value)
 * @param {*} path
 * @return {boolean}
 */
ObjectManage.prototype.$exists = function(path){
  var that = this
  return runValidation.call(
    that,
    that.$validateExists,
    path,
    null,
    'exists',
    function(verb){
      if('ok' === verb || 'warn' === verb){
        return exists(strip(that),path)
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
ObjectManage.prototype.$validateExists = null


/**
 * Remove value and children at desired path (does this by deleting the value)
 * @param {*} path
 * @return {boolean}
 */
ObjectManage.prototype.$remove = function(path){
  var that = this
  return runValidation.call(
    that,
    that.$validateRemove,
    path,
    null,
    'remove',
    function(verb,value){
      if('ok' === verb || 'warning' === verb){
        return remove(that,path)
      } else {
        return value
      }
    }
  )
}


/**
 * Get the paths of the object in dot notation in an array
 * @return {Array}
 */
ObjectManage.prototype.$getPaths = function(){
  return walkTree(this)
}


/**
 * Validation of removal directives
 * @type {null}
 */
ObjectManage.prototype.$validateRemove = null


/**
 * Merge arguments into data object
 * Can be an Array or recursive Array of objects that get merged
 * in the order they are passed
 * Takes any number of Objects tobe merged together in order of passing
 */
ObjectManage.prototype.$load = function(){
  var that = this
  var data
  if(arguments.length > 1){
    for(var i = 0; i < arguments.length; i++){
      that.$load(arguments[i])
    }
  } else {
    data = arguments[0]
    if('object' === typeof data){
      var depth = that.$countDepth(data)
      if(depth >= that.$maxDepth){
        that.$e.emit('warning',that,'Object being merged is too deep (' + depth +')')
        console.log('WARN [object-manage]: Object being merged is too deep (' + depth +')')
        console.trace()
      }
      runValidation.call(
        that,
        that.$validateLoad,
        null,
        data,
        function(verb,message,path,value){
          //console.log(that)
          //process.exit()
          if('ok' === verb){
            that.$e.emit('load',value)
          } else {
            that.$e.emit(verb,'load',message,path,value)
          }
        },
        function(verb,value){
          if('ok' === verb || 'warn' === verb){
            //strip the internals and return the values
            var obj = strip(that)
            //merge the new values on to the old values
            var result = that.$merge(obj,value)
            //add values
            for(var i in result){
              if(!result.hasOwnProperty(i)) continue
              that[i] = result[i]
            }
            //return resulting object
            return that
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
ObjectManage.prototype.$validateLoad = null


/**
 * Merge implementation using object-merge
 * @param {object} obj1
 * @param {object} obj2
 * @return {object}
 */
ObjectManage.prototype.$objectMerge = function(obj1,obj2){
  var opts = objectMerge.createOptions({
    depth: this.$maxDepth,
    throwOnCircularRef: true
  })
  return objectMerge(opts,obj1,obj2)
}


/**
 * Merge prototype allowed to be overirden
 * @type {object}
 */
ObjectManage.prototype.$merge = ObjectManage.prototype.$objectMerge


/**
 * Count the depth of an object and return
 * @param {object} obj  Target object
 * @return {Number}
 */
ObjectManage.prototype.$countDepth = function(obj){
  return countDepth(obj,this.$maxDepth)
}


/**
 * Instance of the storage backend
 * @type {null}
 */
ObjectManage.prototype.$driver = null


/**
 * Setup the storage backend
 * @param {StorageDriver} driver
 * @return {ObjectManage}
 */
ObjectManage.prototype.$storage = function(driver){
  var Driver
  if(driver instanceof StorageDriver){
    this.$driver = driver
  } else if('string' === typeof driver){
    Driver = require('../drivers/' + driver)
    this.$driver = new Driver()
  } else if('object' === typeof driver){
    Driver = require('../drivers/' + driver.driver)
    this.$driver = new Driver(driver.options)
  }
  return this
}


/**
 * Reference to the storage driver class
 * @type {StorageDriver}
 */
ObjectManage.$StorageDriver = require('./StorageDriver')


/**
 * Generate Instance Handle if not already set
 */
ObjectManage.prototype.$generateHandle = function(){
  if(undefined === this.handle){
    var handle = uuid.v4()
    this.$setHandle(handle)
    this.$e.emit('generateHandle',handle)
  }
}


/**
 * Set instance handle explicitly
 * @param {string} handle
 */
ObjectManage.prototype.$setHandle = function(handle){
  this.$handle = handle
}


/**
 * Return the instance handle that is currently set
 * will be null if not yet generated
 * @return {string}
 */
ObjectManage.prototype.$getHandle = function(){
  return this.$handle
}


/**
 * Save to the storage backend
 * Callback params: err, handle, data
 * @param {function} cb
 */
ObjectManage.prototype.$save = function(cb){
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  var that = this
  that.$generateHandle()
  if('function' === typeof that.$driver.save){
    that.$driver.save(that.$handle,strip(that),function(err){
      that.$e.emit('save',that.$handle,that)
      cb(err,that.$handle,that)
    })
  } else {
    var err = 'driver (' + that.$driver.name + ') has not implemented a save method'
    that.$e.emit('save',err)
    cb(err)
  }
}


/**
 * Restore frozen object by its handle
 * @param {string} handle
 * @param {function} cb
 */
ObjectManage.prototype.$restore = function(handle,cb){
  var that = this
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  that.$setHandle(handle)
  if('function' === typeof that.$driver.restore){
    that.$driver.restore(that.$handle,function(err,data){
      if(err){
        that.$e.emit('restore',err)
        cb(err)
      } else {
        that.$load(data)
        that.$e.emit('restore',null,data)
        cb(null,data)
      }
    })
  } else {
    var err = 'driver (' + that.$driver.name + ') has not implemented a restore method'
    that.$e.emit('restore',err)
    cb(err)
  }
}


/**
 * Flush the object stored by the storage driver
 * @param {function} cb
 */
ObjectManage.prototype.$flush = function(cb){
  var that = this
  if('function' !== typeof cb){
    cb = function(err){
      if(err) throw err
    }
  }
  if(null === that.$handle){
    throw new Error('cannot flush without a handle being set')
  } else if('function' === typeof that.$driver.flush){
    that.$driver.flush(that.$handle,function(err){
      if(err){
        that.$e.emit('flush',err)
        cb(err)
      } else {
        that.$e.emit('flush')
        that = flush(that)
        cb()
      }

    })
  } else {
    var err = 'driver (' + that.$driver.name + ') has not implemented a flush method'
    that.$e.emit('flush',err)
    cb(err)
  }
}


/**
 * Reset data store
 * @return {ObjectManage}
 */
ObjectManage.prototype.$reset = function(){
  var that = this
  that = flush(that)
  return that
}


/**
 * Return a stripped version of the object (remove the extensions)
 * @return {object}
 */
ObjectManage.prototype.$strip = function(){
  return strip(this)
}


/**
 * Static version of strip
 * @param {ObjectManage} obj
 * @return {object}
 */
ObjectManage.$strip = function(obj){
  if(!(obj instanceof ObjectManage)) return obj
  return strip(obj)
}


/**
 * Extract internals of an
 * @param {ObjectManage} obj
 * @return {object}
 */
ObjectManage.$extract = function(obj){
  if(!(obj instanceof ObjectManage)) return obj
  return extract(obj)
}


/**
 * Static constructor
 * @param {object} obj
 * @return {ObjectManage}
 */
ObjectManage.$extend = function(obj){
  if(obj instanceof ObjectManage) return obj
  return new ObjectManage(obj)
}


/**
 * Clone an object and break all references
 *  if the pass object is ObjectManage it will
 *  return a new instance with the copied data
 * @param {object|ObjectManage} obj
 * @return {object|ObjectManage}
 */
ObjectManage.$clone = function(obj){
  var om = false
  var int
  //if ObjectManage is passed, extract the old instance and strip it for cloning
  if(obj instanceof ObjectManage){
    om = true
    int = extract(obj)
    obj = strip(obj)
  }
  //use JSON to break relationships reliably
  var clone = JSON.parse(JSON.stringify(obj))
  //return the object if no ObjectManage passed
  if(!om) return clone
  //setup new ObjectManage and replace internals
  var rv = new ObjectManage(clone)
  for(var i in int){
    if(!int.hasOwnProperty(i)) continue
    rv[i] = int[i]
  }
  return rv
}


/**
 * Count depth on an object
 * @param {object} obj
 * @param {Number} maxDepth
 * @return {Number}
 */
ObjectManage.$countDepth = function(obj,maxDepth){
  return countDepth(obj,maxDepth)
}


/**
 * Export library
 * @type {ObjectManage}
 */
module.exports = ObjectManage
