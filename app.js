var url = require('url');
var connect = require('connect');
var hello = require('./hello-server.js');

var port=process.env.PORT || 5500;


//
// Initiate the database
//
var db = require('./db.js');
db.table = "apps";
/*
CREATE TABLE apps (
	service VARCHAR(40) NOT NULL,
	client_id VARCHAR(2000) NOT NULL,
	client_secret VARCHAR(2000) NOT NULL,
	admin_id VARCHAR(2000) NOT NULL,
	guid VARCHAR UNIQUE DEFAULT MD5(CAST(RANDOM() AS VARCHAR)),
	PRIMARY KEY(service, client_id)
);

ALTER TABLE apps ADD COLUMN guid VARCHAR UNIQUE DEFAULT MD5(CAST(RANDOM() AS VARCHAR));

heroku pg:psql HEROKU_POSTGRESQL_BLUE_URL
*/



//
// Connect to the http server
// Serve static content from the BIN directory
//
var app = connect().use(
	connect.static( __dirname + '/bin')
);

console.log("HTTP server listening on port "+ port);
app.listen(port);


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
		var qs = hello.utils.param(location.search||'');
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
	var qs = hello.utils.param(location.search||'');

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
					hello.utils.param(body);
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
			// @todo check that the access_token belongs to the user

			// Get the apps that they have registered
			db.query('SELECT * FROM apps ' +
				'WHERE admin_id SIMILAR TO $1',
				['%\\m'+qs.admin_id+'\\M%'],
				function(err,result){
					callback(result);
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

//
// HelloJS
//


//
// Listen for auth calls
// Listen to incoming responses to the path proxy
//
app.use('/proxy', hello.request );

// If use native clientServer use listen
// e.g. hello.listen(app,'/proxy');

//
// Override redirection
//
hello.interceptRedirect = function(path,hash){
	if(hash && "error" in hash ){
		switch(hash.error){
			case "consumer_key_unknown" :
				hash.error_message = "Please check your application id and settings locally and at https//auth-server.herokuapp.com";
			break;
			case "signature_invalid" :
				hash.error_message = "Your application needs to be registered at https//auth-server.herokuapp.com";
			break;
		}
	}
};


//
// Override the credentials access
// Return the secret from a database
hello.getCredentials = function(network,id,callback){

	// No Credentials?
	// Retrun NULL, and accept default handling
	if(!network||!id){
		callback(null);
		return;
	}

	//
	// Search the database
	// Get all the current stored credentials
	//
	db.query('SELECT client_secret FROM apps WHERE client_id = $1 AND service = $2 LIMIT 1',
		[id, network],
		function(err,result){

			//Callback
			// "/#network="+encodeURIComponent(network)+"&client_id="+encodeURIComponent(id)
			callback( result.rows.length ? result.rows[0].client_secret : null );
		});
};