'use strict';
var util = require('util')
/**
 * Object Manage Validate Instance
 * @param verb
 * @param message
 * @param path
 * @param value
 * @constructor
 */
var Validate = function(verb,message,path,value){
  Error.call(this)
  this.message = message
  this.verb = verb
  this.path = path
  this.value = value
}
//inherit Error prototype
util.inherits(Validate,Error)
/**
 * Verb to handle the validation call
 * @type {null}
 */
Validate.prototype.verb = null
/**
 * Path being operated on
 * @type {null}
 */
Validate.prototype.path = null
/**
 * Value of the call be validated
 * @type {undefined}
 */
Validate.prototype.value = undefined

module.exports = exports = Validate