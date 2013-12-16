var merge = require('merge')
  , util = require('util')

var get = function(target,path){
  var o = target
    , p = path.split('.')
    , i, a
  for(i = 0; o && (a = p[i++]); o = o[a]){
    if(undefined === o[a]) return undefined
  }
  return o
}

var set = function(target,path,value){
  var o = target
  for(var a,p=path.split('.'),i=0; o&&(a=p[i++]); o=o[a]){
    if(i !== p.length && undefined === o[a]) o[a] = {}
    else if(i !== p.length && 'object' !== typeof o[a]) o[a] = {}
    else if(i === p.length) o[a] = value
  }
  return value
}

var ObjectManage = function(data){
  this.data = {}
  this.load(data)
}

ObjectManage.prototype.data = {}

ObjectManage.prototype.set = function(path,value){
  return set(this.data,path,value)
}

ObjectManage.prototype.get = function(path){
  return get(this.data,path)
}

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