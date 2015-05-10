// Add redirect
module.exports = function(req, res, next) {
	res.redirect = function(url){
		res.writeHead(301, {'Location': url});
		res.end();
	};
	next();
};