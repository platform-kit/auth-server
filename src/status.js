var db = require('./db');
var connect = require('connect');

// Export this module as middleware
var app = module.exports = connect();
app.use(function(req, res) {

	// Database connection still ticking?
	// Make an arbitary call...
	var q = db.query('SELECT COUNT(*) FROM apps LIMIT 1',
		[],
		function(err,result){
			if (err) {
				res.writeHead(503);
				res.end("Status: failing", 'utf-8');
			}
			else {
				res.end("Status: ok", 'utf-8');
				// console.log("rows", result.rows[0].count);
			}
		});
});
