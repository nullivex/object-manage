'use strict';
var StorageDriver = require('../lib/StorageDriver')

//the actual storage handle
var store = {}

var driver = StorageDriver.create('memory')
driver.prototype.save = function(handle,data,next){
  store[handle] = data
  next()
}
driver.prototype.restore = function(handle,next){
  if('object' === typeof store[handle]){
    next(null,store[handle])
  } else {
    next('restoration of handle (' + handle + ') failed, handle doesnt exist')
  }
}
driver.prototype.flush = function(handle,next){
  delete store[handle]
  next()
}
module.exports = driver