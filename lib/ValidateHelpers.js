'use strict';
var Validate = require('./Validate')



/**
 * Validate Helpers construction
 * @param {string} path
 * @param {*} value
 * @constructor
 */
var ValidateHelpers = function(path,value){
  this.path = path || null
  this.value = value || undefined
}


/**
 * Convenience method to drop a request
 * @param {string} message
 */
ValidateHelpers.prototype.drop = function(message){
  throw new Validate('drop',message,this.path,this.value)
}


/**
 * Convenience method to reject a request
 * @param {string} message
 */
ValidateHelpers.prototype.reject = function(message){
  throw new Validate('reject',message,this.path,this.value)
}


/**
 * Convenience method to warn about a request
 * @param {string} message
 * @param {*} value
 */
ValidateHelpers.prototype.warn = function(message,value){
  throw new Validate('warn',message,this.path,value)
}


/**
 * Convenience method to error about a request
 * @param {string} message
 */
ValidateHelpers.prototype.error = function(message){
  throw new Validate('error',message,this.path,this.value)
}


/**
 * Convenience method to succeed a request
 * @param {*} value
 */
ValidateHelpers.prototype.ok = function(value){
  throw new Validate('ok',null,this.path,value)
}


/**
 * Export lib
 * @type {ValidateHelpers}
 */
module.exports = exports = ValidateHelpers
