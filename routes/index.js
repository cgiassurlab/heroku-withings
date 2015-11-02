
/*
 * routes/index.js
 *
 * Routes contains the functions (callbacks) associated with request urls.
 */

/**
 * GET '/'
 * Default home route. Just relays a success message back.
 * @param  {Object} req
 * @return {Object} json
 */

exports.index = function(req, res) {

	console.log("main route requested");

	var data = {
		status: 'OK',
		message: 'Welcome to TOLVelocityApp'
	};

	// respond back with the data
	res.json(data);

};
