'use strict';

module.exports = (req, res, next) => {
	res.redirect = (url) => {
		res.writeHead(301, {'Location': url});
		res.end();
	};
	next();
};
