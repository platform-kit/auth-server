require('newrelic');
var url = require('url');
var connect = require('connect');
var serveStatic = require('serve-static');
var oauthshim = require('./lib/oauth-shim');
var param = require('./lib/utils/param');
var DEBUG = !process.env.PORT;
var port=process.env.PORT || 5500;
var dear = require('dear');

dear.init({
	yahoo : {
		client_id : process.env.YAHOO_ID,
		client_secret : process.env.YAHOO_SECRET
	}
});


//
// Initiate the database
//
var db = require('./db.js');
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


//
// Connect to the https server
// Serve static content from the BIN directory
//
var app = connect();

// Add redirect
app.use(function(req, res, next) {
	res.redirect = function(url){
		res.writeHead(301, {'Location': url});
		res.end();
	};
	next();
});


// ENFORCE SSL

app.use(function(req,res,next){
	var heroku_scheme = req.headers['x-forwarded-proto'];

	if( heroku_scheme && heroku_scheme !== 'https' ){
		res.redirect('https://' + req.headers.host +req.url);
	}
	else{
		next(); /* Continue to other routes if we're not redirecting */
	}
});


// FAVICON
app.use(function(req,res,next){
	if( req.url === '/favicon.ico' ){
		res.redirect('https://adodson.com/favicon.ico');
		return;
	}
	next();
});

//
// Use the BIN directory as a public static folder
app.use(
	serveStatic( __dirname + '/bin')
);

console.log("HTTP server listening on port "+ port);
app.listen(port);


// Status
// Print out a status message
app.use("/status", function(req,res){

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



//
// Listen out for REST API access
// Serve the database
//
app.use("/rest", function(req,res){

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
	rest(req, function(response){

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

					callback.call(null,result);
				});
			}

		}
	});
}




// /////////////////////////////////////////////
//
// Apply the node-oauth-shim
// app.use('/proxy', oauthshim);
//
// /////////////////////////////////////////////

//
// Listen for auth calls
// Listen to incoming responses to the path proxy
//
app.use('/proxy', oauthshim.interpret);
app.use('/proxy', oauthshim.proxy);

// Change the error handler messages coming from this
app.use('/proxy', function(req, res, next){

	if( req.oauthshim && req.oauthshim.data && req.oauthshim.redirect ){

		var data = req.oauthshim.data;

		if( "error" in data ){
			// Change the default messages in the response
			switch(data.error){
				case "consumer_key_unknown" :
					data.error_message = "Please check your application id and settings locally and at https//auth-server.herokuapp.com";
				break;
				case "signature_invalid" :
					data.error_message = "Your application needs to be registered at https//auth-server.herokuapp.com";
				break;
				case "invalid_credentials" :
				case "required_credentials" :
					data.error_message = "Could not find the credentials that match the provided client_id. Register your app credentials by visiting https//auth-server.herokuapp.com";
				break;
			}
		}
	}
	next();
});


// Was the login for this server
// auth-server maintains its own list of users
app.use('/proxy', function(req, res, next){

	if( req.oauthshim && req.oauthshim.data && req.oauthshim.redirect ){

		var data = req.oauthshim.data;
		var opts = req.oauthshim.options;
		var redirect = req.oauthshim.redirect;

		// Was this an OAuth Login response and does it contain a new access_token?
		if( "access_token" in data && !( "path" in opts ) ){
			// Store this access_token
			console.log("Session created", data.access_token.substr(0,8) + '...' );
		}
	}
	next();
});


app.use('/proxy', oauthshim.redirect);
app.use('/proxy', oauthshim.unhandled);


// If use native clientServer use listen
// e.g. oauthshim.listen(app,'/proxy');



//
// Override the credentials access
// Return the secret from a database
oauthshim.getCredentials = function(id,callback){

	// No Credentials?
	// Retrun NULL, and accept default handling
	if(!id){
		callback(null);
		return;
	}

	//
	// Search the database
	// Get all the current stored credentials
	//
	db.query('SELECT client_secret FROM apps WHERE client_id = $1 LIMIT 1',
		[id],
		function(err,result){

			//Callback
			// "/#network="+encodeURIComponent(network)+"&client_id="+encodeURIComponent(id)
			callback( result.rows.length ? result.rows[0].client_secret : null );
		});
};