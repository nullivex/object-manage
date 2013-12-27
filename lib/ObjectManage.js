'use strict';
var util = require('util')
  , events = require('events')

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
 * Object Manage Validate Instance
 * @param verb
 * @param message
 * @param path
 * @param value
 * @constructor
 */
var Validate = function(verb,message,path,value){
  Error.call(this)
  this.message = message
  this.verb = verb
  this.path = path
  this.value = value
}
//inherit Error prototype
util.inherits(Validate,Error)
/**
 * Verb to handle the validation call
 * @type {null}
 */
Validate.prototype.verb = null
/**
 * Path being operated on
 * @type {null}
 */
Validate.prototype.path = null
/**
 * Value of the call be validated
 * @type {undefined}
 */
Validate.prototype.value = undefined

/**
 * Validate Helpers construction
 * @param path
 * @param value
 * @constructor
 */
var ValidateHelpers = function(path,value){
  this.path = path
  this.value = value
}
/**
 * Path being operated on
 * @type {null}
 */
ValidateHelpers.prototype.path = null
/**
 * Value being operated on
 * @type {null}
 */
ValidateHelpers.prototype.value = null
/**
 * Convenience method to drop a request
 * @param message
 */
ValidateHelpers.prototype.drop = function(message){
  throw new Validate('drop',message,this.path,this.value)
}
/**
 * Convenience method to reject a request
 * @param message
 */
ValidateHelpers.prototype.reject = function(message){
  throw new Validate('reject',message,this.path,this.value)
}
/**
 * Convenience method to warn about a request
 * @param message
 * @param value
 */
ValidateHelpers.prototype.warn = function(message,value){
  throw new Validate('warn',message,this.path,value)
}
/**
 * Convenience method to error about a request
 * @param message
 */
ValidateHelpers.prototype.error = function(message){
  throw new Validate('error',message,this.path,this.value)
}
/**
 * Convenience method to succeed a request
 * @param value
 */
ValidateHelpers.prototype.ok = function(value){
  throw new Validate('ok',null,this.path,value)
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
ObjectManage.prototype.Validate = Validate

/**
 * Set respective path to value
 * @param path
 * @param value
 */
ObjectManage.prototype.set = function(path,value){
  var err = null
  if('function' !== typeof this.validateSet){
    set(this.data,path,value)
    this.emit('set',path,value)
    return true
  } else {
    try {
      value = this.validateSet.call(new ValidateHelpers(path,value),path,value)
    } catch(e){
      if(!(e instanceof Validate)){
        throw e
      } else {
        err = e
      }
    }
    if(null === err || 'ok' === err.verb){
      if(null !== err && 'ok' === err.verb) value = err.value
      set(this.data,path,value)
      this.emit('set',path,value)
      return true
    } else if('warn' === err.verb){
      set(this.data,path,value)
      this.emit('warn','set',err.message,path,value)
      return false
    } else if('drop' === err.verb){
      this.emit('drop','set',err.message,path,value)
      return true
    } else if('reject' === err.verb){
      this.emit('reject','set',err.message,path,value)
      return false
    } else {
      this.emit('error','set',err.message,path,value)
      throw new Error(err.message)
    }
  }
}

/**
 * Validation for set directives
 *
 * Takes two arguments (path,value)
 * And should return true for valid and false for invalid
 * If invalid false is returned to the set call.
 * Exceptions should be thrown by the validate function
 * directly
 * @type {null}
 */
ObjectManage.prototype.validateSet = null

/**
 * Get value of path returns undefined if path does not exist
 * @param path
 * @returns {}
 */
ObjectManage.prototype.get = function(path){
  var err = null
    , value = get(this.data,path)
  if('function' !== typeof this.validateGet){
    this.emit('get',path,value)
    return value
  } else {
    try {
      value = this.validateGet.call(new ValidateHelpers(path,value),path,value)
    } catch(e){
      if(!(e instanceof Validate)){
        throw e
      } else {
        err = e
      }
    }
    //console.log(err)
    if(null === err || 'ok' === err.verb){
      if(null !== err && 'ok' === err.verb) value = err.value
      this.emit('get',path,value)
      return value
    } else if('warn' === err.verb){
      this.emit('warn','get',err.message,path,value)
      return value
    } else if('drop' === err.verb){
      this.emit('drop','get',err.message,path,value)
      return undefined
    } else if('reject' === err.verb){
      this.emit('reject','get',err.message,path,value)
      return undefined
    } else {
      this.emit('error','get',err.message,path,value)
      throw new Error(err.message)
    }
  }
}

/**
 * Validation for get directives
 *
 * Takes two arguments (path,value)
 * And should return true for valid and false for invalid
 * If invalid false is returned to the get call.
 * Exceptions should be thrown by the validate function
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
  var value = exists(this.data,path)
  this.emit('exists',path,value)
  return value
}

/**
 * Remove value and children at desired path (does this by deleting the value)
 * @param path
 * @returns {boolean}
 */
ObjectManage.prototype.remove = function(path){
  var value = remove(this.data,path)
  this.emit('remove',path,value)
  return value
}

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
      self.data = self.merge(self.data,data) || {}
      self.emit('load',self.data)
    }
  }
}

/**
 * Merge implementation using object-merge
 * @param obj1
 * @param obj2
 * @returns {*|exports}
 */
ObjectManage.prototype.objectMerge = function(obj1,obj2){
  var objectMerge = require('object-merge')
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
  return require('merge-recursive').recursive(obj1,obj2)
}

/**
 * Merge prototype allowed to be overirden
 * @param obj1
 * @param obj2
 * @returns {*|exports}
 */
Object.prototype.merge = ObjectManage.prototype.objectMerge

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

module.exports = ObjectManage