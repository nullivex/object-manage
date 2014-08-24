'use strict';



/**
 * Object Manage Validate Instance
 * @param {string} verb
 * @param {string} message
 * @param {string} path
 * @param {*} value
 * @constructor
 */
var Validate = function(verb,message,path,value){
  Error.call(this)
  this.message = message
  this.verb = verb
  this.path = path
  this.value = value
}
Validate.prototype = Object.create(Error.prototype)


/**
 * Export lib
 * @type {Validate}
 */
module.exports = exports = Validate
