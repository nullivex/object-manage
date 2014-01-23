'use strict';
var util = require('util')
/**
 * Constructor which sets up the driver
 * @param options
 * @constructor
 */
var StorageDriver = function(options){
  if('object' !== typeof options) options = {}
  if('function' !== typeof options.ready){
    options.ready = function(err){
      if(err) throw err
    }
  }
  this.setup(options,function(err){
    options.ready(err)
  })
}
/**
 * Create a StorageDriver extension and inherit
 * @param name
 * @returns {Function}
 */
StorageDriver.create = function(name){
  var obj = function(options){
    StorageDriver.call(this,options)
  }
  util.inherits(obj,StorageDriver)
  obj.prototype.name = name
  return obj
}
/**
 * Driver name
 * @type {null}
 */
StorageDriver.prototype.name = 'driver'
/**
 * Handle for instance control of connections
 * @type {null}
 */
StorageDriver.prototype.handle = null
/**
 * Driver setup method
 * @type {null}
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

module.exports = exports = StorageDriver