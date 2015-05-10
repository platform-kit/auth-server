// App
var url = require('url');
var connect = require('connect');
var oauthshim = require('oauth-shim');
var port = process.env.PORT || 5500;


// Connect to the https server
var app = connect();

// Use the BIN directory as a public static folder
app.use(require('serve-static')( __dirname + '/../bin'));

// Add res.redirect method
app.use(require('./utils/httpRedirect'));

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

// Handle favicon
app.use(function(req,res,next){
	if( req.url === '/favicon.ico' ){
		res.redirect('https://adodson.com/favicon.ico');
		return;
	}
	next();
});


// Listen
app.listen(port);
console.log("HTTP server listening on port "+ port);

// Status
// Print out a status message
app.use("/status", require('./status'));

// Listen out for REST API access
// Serve the database
app.use("/rest", require('./api'));


// /////////////////////////////////////////////
//
// Apply the node-oauth-shim
// app.use('/proxy', oauthshim);
//
// /////////////////////////////////////////////

// Initiate the database
var db = require('./db');

// Listen for auth calls
// Listen to incoming responses to the path proxy
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