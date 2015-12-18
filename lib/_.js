var _ = global._ || {};

module.exports = _;

/**
 * simplest way of clone 
 * @param  {object} obj
 * @return {object}     
 */
Object.prototype.clone = function() {
	return JSON.parse(JSON.stringify(this));
}


/**
 * Adding extend function to Object.prototype
 * @param  {object} obj
 * @return {object}    
 */
_.extend = function(objA, objB) {
	for (var i in objB) {
		if (objB.hasOwnProperty(i)) {
			objA[i] = objB[i];
		}
	}

	return objA;
};

_.noop = function() {};