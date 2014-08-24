'use strict';
var StorageDriver = require('../lib/StorageDriver')

//the actual storage handle
var store = {}

var driver = StorageDriver.create('memory')


/**
 * Save
 * @param {string} handle
 * @param {object} data
 * @param {function} next
 */
driver.prototype.save = function(handle,data,next){
  store[handle] = data
  next()
}


/**
 * Restore
 * @param {string} handle
 * @param {function} next
 */
driver.prototype.restore = function(handle,next){
  if('object' === typeof store[handle]){
    next(null,store[handle])
  } else {
    next('restoration of handle (' + handle + ') failed, handle doesnt exist')
  }
}


/**
 * Flush
 * @param {string} handle
 * @param {function} next
 */
driver.prototype.flush = function(handle,next){
  delete store[handle]
  next()
}


/**
 * Export driver
 * @type {StorageDriver}
 */
module.exports = driver
