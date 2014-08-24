'use strict';



/**
 * Constructor which sets up the driver
 * @param {object} options
 * @constructor
 */
var StorageDriver = function(options){
  if('object' !== typeof options) options = {}
  if('function' !== typeof options.ready){
    options.ready = function(err){
      if(err) throw err
    }
  }
  this.name = 'driver'
  this.handle = null
  this.setup(options,function(err){
    options.ready(err)
  })
}


/**
 * Create a StorageDriver extension and inherit
 * @param {string} name
 * @return {StorageDriver}
 */
StorageDriver.create = function(name){
  var obj = function(options){
    StorageDriver.call(this,options)
  }
  obj.prototype = Object.create(StorageDriver.prototype)
  obj.prototype.name = name
  return obj
}


/**
 * Driver name
 * @type {null}
 */
StorageDriver.prototype.name = 'driver'


/**
 * Driver setup method
 * @param {object} options
 * @param {function} cb
 */
StorageDriver.prototype.setup = function(options,cb){
  cb()
}

/**
 * Driver save method
 * @type {null}
 */
//StorageDriver.prototype.save = function(handle,data,next){next()}
/**
 * Driver restore method
 * @type {null}
 */
//StorageDriver.prototype.restore = function(handle,next){next(null,{})}
/**
 * Driver flush method
 * @type {null}
 */
//StorageDriver.prototype.flush = function(handle,next){next()}


/**
 * Export lib
 * @type {StorageDriver}
 */
module.exports = exports = StorageDriver
