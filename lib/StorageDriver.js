'use strict';

/**
 * Constructor which sets the name of the driver
 * @param name
 * @constructor
 */
var StorageDriver = function(name){
  this.driver.name = name
}

/**
 * Constructor for the driver
 */
StorageDriver.prototype.driver = function(options){
  this.setup(options)
}
/**
 * Driver name
 * @type {null}
 */
StorageDriver.prototype.driver.prototype.name = null
/**
 * Driver setup method
 * @type {null}
 */
StorageDriver.prototype.driver.prototype.setup = null
/**
 * Driver save method
 * @type {null}
 */
StorageDriver.prototype.driver.prototype.save = null
/**
 * Driver restore method
 * @type {null}
 */
StorageDriver.prototype.driver.prototype.restore = null
/**
 * Driver flush method
 * @type {null}
 */
StorageDriver.prototype.driver.prototype.flush = null

/**
 * Set the setup method
 * @param cb
 */
StorageDriver.prototype.setup = function(cb){
  this.driver.setup = cb
}

/**
 * Set the save method
 * @param cb
 */
StorageDriver.prototype.save = function(cb){
  this.driver.save = cb
}

/**
 * Set the restore method
 * @param cb
 */
StorageDriver.prototype.restore = function(cb){
  this.driver.restore = cb
}

/**
 * Set the flush method
 * @param cb
 */
StorageDriver.prototype.flush = function(cb){
  this.driver.flush = cb
}

module.exports = exports = StorageDriver