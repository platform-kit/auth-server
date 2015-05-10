var db = require('./db.js');

module.exports = function(req,res){

	// Database connection still ticking?
	// Make an arbitary call...
	db.query('SELECT COUNT(*) FROM apps LIMIT 1',
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
};