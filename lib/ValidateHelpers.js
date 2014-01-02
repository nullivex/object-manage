'use strict';
var Validate = require('./Validate')
/**
 * Validate Helpers construction
 * @param path
 * @param value
 * @constructor
 */
var ValidateHelpers = function(path,value){
  this.path = path
  this.value = value
}
/**
 * Path being operated on
 * @type {null}
 */
ValidateHelpers.prototype.path = null
/**
 * Value being operated on
 * @type {null}
 */
ValidateHelpers.prototype.value = null
/**
 * Convenience method to drop a request
 * @param message
 */
ValidateHelpers.prototype.drop = function(message){
  throw new Validate('drop',message,this.path,this.value)
}
/**
 * Convenience method to reject a request
 * @param message
 */
ValidateHelpers.prototype.reject = function(message){
  throw new Validate('reject',message,this.path,this.value)
}
/**
 * Convenience method to warn about a request
 * @param message
 * @param value
 */
ValidateHelpers.prototype.warn = function(message,value){
  throw new Validate('warn',message,this.path,value)
}
/**
 * Convenience method to error about a request
 * @param message
 */
ValidateHelpers.prototype.error = function(message){
  throw new Validate('error',message,this.path,this.value)
}
/**
 * Convenience method to succeed a request
 * @param value
 */
ValidateHelpers.prototype.ok = function(value){
  throw new Validate('ok',null,this.path,value)
}

module.exports = exports = ValidateHelpers