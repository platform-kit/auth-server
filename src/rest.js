// REST
// Defines the Web API for managing the site
var connect = require('connect');
var db = require('./db');
var param = require('../lib/utils/param');
var url = require('url');
var dear = require('dear');

// Initiate the yahoo API
dear.init({
	yahoo : {
		client_id : process.env.YAHOO_ID,
		client_secret : process.env.YAHOO_SECRET
	}
});

// Initiate the DB table
db.table = "apps";

/*
CREATE TABLE apps (
	reference VARCHAR(40),
	domain VARCHAR,
	client_id VARCHAR(2000) NOT NULL,
	client_secret VARCHAR(2000) NOT NULL,
	admin_id VARCHAR(2000) NOT NULL,
	guid VARCHAR UNIQUE DEFAULT MD5(CAST(RANDOM() AS VARCHAR)),
	PRIMARY KEY(service, client_id)
);

heroku pg:psql HEROKU_POSTGRESQL_BLUE_URL
*/

// Export this module as middleware
var app = module.exports = connect();

app.use(function(req, res) {

	//
	// CORS
	// Handle each API response with some cross domain headers
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin' : '*',
		'Access-Control-Allow-Methods' : 'OPTIONS,GET,POST,PUT,DELETE',
		"Access-Control-Allow-Headers" : "Origin, X-Requested-With, Content-Type, Accept"
	});

	//
	// Did the user use JSONP?
	// Get the callback parameter with the request
	rest(req, function(response) {

		//
		// Return JSON
		var body = JSON.stringify(response);

		//
		// Does the request ask for JSONP response?
		// Get the callback parameter with the request
		var location = url.parse(req.url);
		var qs = param(location.search||'');
		if(qs&&qs.callback){
			body = qs.callback + "(" + body + ")";
		}

		// Finally, respond
		res.end(body, 'utf-8');
	});
});



//
// REST API
// The REST API serves the interface for getting and saving application data
//
function rest(req, callback){

	// QueryString
	var location = url.parse(req.url);
	var qs = param(location.search||'');

	// Get POST body
	var getData = function(callback){
		if(req.method==='POST'){
			var body = '';
			req.on('data', function(data) {
				body += data;
			});

			req.on('end', function() {
				try{
					body = JSON.parse(body);
				}
				catch(e){
					param(body);
				}
				callback( req.method, body );
			});
		}
		else{
			callback(req.method, null);
		}
	};

	// Get the data
	getData(function(method, data){

		// Get request
		if(data===null){

			if(qs.action==='delete'){
				db.delete({guid : qs.guid}, function(err,result){
					callback.apply(null,err);
				});
				return;
			}


			// Ensure we have identifed the user
			if(!qs.access_token||!qs.admin_id){
				callback({
					error : "access_token and user id required"
				});
				return;
			}

			// Check that the access_token is valid and matches the user id given
			// Abstract the service and the access_token from the URL
			var cred = qs.admin_id.split('@');

			dear( cred[1] )
			.api( 'me', { access_token : qs.access_token })
			.then(function(res){

				if( res.id !== cred[0] ){
					callback({
						error : "Access token does not match credential for "+ cred[1]
					});
					return;
				}

				// Get the apps that they have registered
				db.query('SELECT * FROM apps ' +
					'WHERE admin_id SIMILAR TO $1',
					['%\\m'+qs.admin_id+'\\M%'],
					function(err,result){
						callback(result);
					});

			}, function(e){
				callback(e.error.message);
			});


			return;

		// POST
		}
		else{

			if( !data.guid ){

				db.insert( data, function(err,result){
					console.log(err||result.rows[0]);
					callback.call(null,err||result.rows[0]);
				});

				return;
			}
			else{
				db.update( data, {guid:data.guid}, function(err,result){

					callback.call(null,err||result);
				});
			}

		}
	});
}
