'use strict';
var StorageDriver = require('../lib/StorageDriver')
  , redis = require('redis')


/**
 * Create storage driver
 * @type {StorageDriver}
 */
var driver = StorageDriver.create('redis')


/**
 * Setup
 * @param {object} options
 * @param {function} next
 */
driver.prototype.setup = function(options,next){
  if('object' !== typeof options) options = {}
  var port = options.port || 6379
  var host = options.host || '127.0.0.1'
  var password = options.password || null
  options = options.options || {}
  driver.$redis = redis.createClient(port,host,options)
  if(null !== password){
    driver.$redis.auth(password,function(err){
      if(err) throw err
    })
  }
  driver.$redis.on('ready',function(){
    next()
  })
}


/**
 * Save
 * @param {string} handle
 * @param {object} data
 * @param {function} next
 */
driver.prototype.save = function(handle,data,next){
  driver.$redis.set(handle,JSON.stringify(data),function(err){
    next(err)
  })
}


/**
 * Restore
 * @param {string} handle
 * @param {function} next
 */
driver.prototype.restore = function(handle,next){
  driver.$redis.get(handle,function(err,data){
    next(err,JSON.parse(data))
  })
}


/**
 * Flush
 * @param {string} handle
 * @param {function}next
 */
driver.prototype.flush = function(handle,next){
  driver.$redis.del(handle,function(err){
    next(err)
  })
}


/**
 * Export driver
 * @type {StorageDriver}
 */
module.exports = driver
