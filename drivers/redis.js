'use strict';
var StorageDriver = require('../lib/StorageDriver')
  , redis = require('redis')

var driver = StorageDriver.create()
driver.name = 'redis'
driver.setup = function(options){
  if('object' !== typeof options) options = {}
  var port = options.port || 6379
    , host = options.host || '127.0.0.1'
    , password = options.password || null
  options = options.options || {}
  driver.handle = redis.createClient(port,host,options)
  if(null !== password){
    driver.handle.auth(password,function(err){
      if(err) throw err
    })
  }
}
driver.save = function(handle,data,next){
  driver.handle.set(handle,data,next)
}
driver.restore = function(handle,next){
  driver.handle.get(handle,next)
}
driver.flush = function(handle,next){
  driver.handle.set(handle,undefined,next)
}

module.exports = driver