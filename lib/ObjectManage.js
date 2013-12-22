'use strict';
var merge = require('object-merge')
  , util = require('util')
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
 */
var remove = function(target,path){
  var o = target
  for(var a,p=path.split('.'),i=0; o&&(a=p[i++]); o=o[a]){
    if(i !== p.length && undefined === o[a]) break
    else if(i === p.length){
      o[a] = undefined
      delete o[a]
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
 * Set respective path to value
 * @param path
 * @param value
 */
ObjectManage.prototype.set = function(path,value){
  set(this.data,path,value)
}

/**
 * Get value of path returns undefined if path does not exist
 * @param path
 * @returns {}
 */
ObjectManage.prototype.get = function(path){
  return get(this.data,path)
}

/**
 * Check if path exists (uses hasOwnProperty and is safe to having undefined set as a value)
 * @param path
 * @returns {boolean}
 */
ObjectManage.prototype.exists = function(path){
  return exists(this.data,path)
}

/**
 * Remove value and children at desired path (does this by deleting the value)
 * @param path
 * @returns {}
 */
ObjectManage.prototype.remove = function(path){
  return remove(this.data,path)
}

/**
 * Merge arguments into data object
 * Can be an Array or recursive Array of objects that get merged
 * in the order they are passed
 * @param data
 */
ObjectManage.prototype.load = function(data){
  var that = this
  if(util.isArray(data)){
    data.forEach(function(v){
      that.load(v)
    })
  } else {
    if('object' === typeof data){
      var depth = this.countDepth(data)
      if(depth >= this.maxDepth){
        console.log('WARN [object-manage]: Object being merged is too deep (' + depth +')')
        console.trace()
      }
      that.data = merge(that.data,data) || {}
      this.emit('load',that.data)
    }
  }
}

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