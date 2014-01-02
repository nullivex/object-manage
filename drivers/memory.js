'use strict';
var StorageDriver = require('../lib/StorageDriver')
  , util = require('util')

var driver = function(options){
  StorageDriver.call(this,options)
}
util.inherits(driver,StorageDriver)
driver.name = 'memory'
driver.save = function(handle,data,next){
  next()
}
driver.restore = function(handle,next){
  next()
}
driver.flush = function(next){
  next()
}
module.exports = exports = driver