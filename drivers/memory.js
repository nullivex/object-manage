'use strict';
var StorageDriver = require('../lib/StorageDriver')

var driver = new StorageDriver('memory')
driver.save(function(handle,data,next){
  next()
})
driver.restore(function(handle,next){
  next()
})
driver.flush(function(next){
  next()
})

module.exports = driver