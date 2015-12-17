// logout

'use strict';
var debug = require('debug')('auth/logout');

// Export this module as middleware
module.exports = function(req, res) {

	// Removing session
	req.session.destroy(() => {
		debug('session destroyed');
	});

	// Display the page
	res.render('logout');
};

// Notice
debug('auth/logout ready');
