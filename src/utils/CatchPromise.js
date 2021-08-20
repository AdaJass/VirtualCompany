var _={};
/**
 * 
 * @param {Promise} promise
 * @return {Array}
 * @example 
 * [err, result]
 * [null, result]
*/
_.to = function (promise){ 
    return promise.then(res => [null, res]).catch(error => [error]);
}

/**
 * @param {Promise} promise
 * @param {Function} next express next
*/
_.iferrnext = function (promise, next){ 
    return promise.then(rs =>rs).catch(next);
}

/**
 * @param {Promise} promise
*/
_.iferrlog = function (promise){ 
    return promise.then(rs =>rs).catch(console.error);
}

/**
 * @param {Promise} promise
*/
_.iferrthrow = function (promise){ 
    return promise.then(rs =>rs).catch(err=>{throw new Error(err)});
}

module.exports = _;