'use strict';
var StorageDriver = require('../lib/StorageDriver')
  , redis = require('redis')

var driver = StorageDriver.create('redis')
driver.prototype.setup = function(options,next){
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
  driver.handle.on('ready',function(){
    next()
  })
}
driver.prototype.save = function(handle,data,next){
  driver.handle.set(handle,JSON.stringify(data),function(err){
    next(err)
  })
}
driver.prototype.restore = function(handle,next){
  driver.handle.get(handle,function(err,data){
    next(err,JSON.parse(data))
  })
}
driver.prototype.flush = function(handle,next){
  driver.handle.del(handle,function(err){
    next(err)
  })
}

module.exports = driver