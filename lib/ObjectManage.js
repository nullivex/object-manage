var merge = require('merge')
  , util = require('util')

/**
 * Private function to traverse the target and return
 * the path
 * @param target
 * @param path
 * @returns {*}
 */
var get = function(target,path){
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
  var o = target
  for(var a,p=path.split('.'),i=0; o&&(a=p[i++]); o=o[a]){
    if(i !== p.length && undefined === o[a]) o[a] = {}
    else if(i !== p.length && 'object' !== typeof o[a]) o[a] = {}
    else if(i === p.length) o[a] = value
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
  this.data = {}
  this.load(data)
}

/**
 * The object to manage
 * @type {{}}
 */
ObjectManage.prototype.data = {}

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
    that.data = merge(that.data,data)
  }
}

module.exports = ObjectManage