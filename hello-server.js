var https = require('https');
var http = require('http');
var url = require('url');
//var hello_modules = require('./hello_modules.js');
var oauth = require('./oauth.js');
//var oa = require('oauth').OAuth;

// Set our API object as exportablee
module.exports = new (function(){

	// Add the modules
	var services = {};

	// Define self
	var self = this;

	// token=>secret lookup
	var _token_secrets = {};

	//
	// Define the environments
	//
	this.init = function(obj){
		services = this.utils.merge(services, obj);
	};

	//
	// Login
	//
	this.login = function(p, callback){

		// Take the obj and make a call to the server
		if(	p.oauth.version === 1 ){
			return;
		}

/*
		opts.path = 'http://' + opts.host + ':' + opts.port + opts.path;
		opts.headers = opts.headers||{};
		opts.headers.host = opts.host;
		opts.host = '127.0.0.1';
		opts.port = 8888;
*/

		self.getCredentials( p.client_id || p.id, function(response){

			// Make the OAuth2 request
			var post = self.utils.param({
				code : p.code,
				client_id : p.client_id || p.id,
				client_secret : response,
				grant_type : 'authorization_code',
				redirect_uri : encodeURIComponent(p.redirect_uri)
			}, function(r){return r;});

			var opts = url.parse( p.grant_url || p.oauth.grant );
			opts.method = 'POST';
			opts.headers = {
				'Content-length': post.length,
				'Content-type':'application/x-www-form-urlencoded'
			};

			//opts.body = post;

			var req = https.request( opts, function(res){

				var bits = "";
				res.on('data', function (chunk) {
					bits += chunk;
				});
				res.on('end', function () {

					console.log(bits);
					try{
						data = JSON.parse(bits);
					}
					catch(e){
						try{
							data = self.utils.param(bits.toString('utf8', 0, bits.length));
						}
						catch(e2){
							console.log("Crap, grant response fubar'd");
						}
					}

					callback(data);
				});
			});

			self.utils.log( post );
			req.write( post );

			req.end();
		});

	};


	//
	// Listen
	// Bind to an existing server listener
	//
	this.listen = function(server, requestPathname){

		// Store old Listeners
		var oldListeners = server.listeners('request');
		server.removeAllListeners('request');

		server.on('request', function (req, res) {

			// Lets let something else handle this.
			// Trigger all oldListeners
			function passthru(){
				for (var i = 0, l = oldListeners.length; i < l; i++) {
					oldListeners[i].call(server, req, res);
				}
			}

			// If the request is limited to a given path, here it is.
			if( requestPathname && requestPathname !== url.parse(req.url).pathname ){
				passthru();
				return;
			}

			//
			self.request(req,res);

		});
	};


	//
	// Request
	// Defines the callback from the server listener
	this.request = function(req,res){

		// if the querystring includes
		// An authentication "code",
		// client_id e.g. "1231232123",
		// response_uri, "1231232123",
		var p = self.utils.param(url.parse(req.url).search);
		var state = p.state;


		// Has the parameters been stored in the state attribute?
		try{
			// decompose the p.state, redefine p
			p = self.utils.merge( p, JSON.parse(p.state) );
			p.state = state; // set this back to the string
		}
		catch(e){
		}
		console.log(p);


		//
		// Process, pass the request the to be processed,
		// The returning function contains the data to be sent
		function redirect(path, hash){

			// Overwrite intercept
			if("interceptRedirect" in self){
				self.interceptRedirect(path,hash);
			}

			res.writeHead(302, {
				'Access-Control-Allow-Origin':'*',
				'Location': path + (hash ? '#'+ self.utils.param( hash ) : '') } );
			res.end();
		}

		function serveUp(body){
			if(p.callback){
				body = p.callback + "('" + body + "')";
			}
			res.writeHead(200, { 'Access-Control-Allow-Origin':'*' });
			res.end( body ,"utf8");
		}


		//
		// OAUTH2
		//
		if( p.code && p.state && p.redirect_uri ){

			self.login( p, function(response){

				// Redirect page
				// With the Auth response, we need to return it to the parent
				redirect( p.redirect_uri, self.utils.merge({state:p.state, expires_in:3600}, response));
				return;

			});
			return;
		}


		//
		// OAUTH1
		//
		else if( ( p.redirect_uri && p.oauth && parseInt(p.oauth.version,10) === 1 ) || ( p.token_url ) ){

			self.location = url.parse("http"+(req.connection.encrypted?"s":'')+'://'+req.headers.host+req.url);

			self.loginOAuth1(p, function(path,hash){
				redirect(path,hash);
			});

			return;
		}

		//
		// SUBSEQUENT SIGNING OF REQUESTS
		// Previously we've been preoccupoed with handling OAuth authentication/
		// However OAUTH1 also needs every request to be signed.
		//
		else if( p.access_token && p.path ){

			//
			// The access_token is of the format which can be decomposed
			//
			var token = p.access_token.match(/^([^:]+)\:([^@]+)@(.+)$/);
			var path = p.path;

			self.getCredentials( token[3], function(client_secret){

				if(client_secret){

					path = oauth.sign( p.path, {
						oauth_token: token[1],
						oauth_consumer_key : token[3]
					}, client_secret, token[2], null, (p.method||req.method).toUpperCase(), p.data?JSON.parse(p.data):null);

				}

				if(req.method==='GET'&&(!p.method||p.method.toUpperCase()==='GET')){
					// redirect the users browser to the new path
					redirect(path);
				}
				else{
					serveUp(path);
				}
			});

			return;
		}
	};



	//
	// getCredentials
	// Given a network name and a client_id, returns the client_secret
	//
	this.getCredentials = function(id, callback){

		callback( id ? services[id] : false );

	};


	//
	// OAuth 1
	// Thi handles the OAuth1 authentication flow
	//
	this.loginOAuth1 = function(p,callback){

		//
		// Get the Authorization path
		//
		// p = self.utils.merge(services[p.network], p);
		var	path,
			token_secret = null;

		var opts = {
			oauth_consumer_key : p.client_id
		};

		//
		// OAUTH 1: FIRST STEP
		// The oauth_token has not been provisioned.
		//
		if(!p.oauth_token){

			// Change the path to be that of the intiial handshake
			path = (p.request_url || p.oauth.request);

			//
			// Create the URL of this service
			// We are building up a callback URL which we want the client to easily be able to use.

			// Callback
			var oauth_callback = p.redirect_uri + (p.redirect_uri.indexOf('?')>-1?'&':'?') + self.utils.param({
				proxy_url : self.location.protocol + '//'+ self.location.host + self.location.pathname,
				state     : p.state,
				token_url : p.token_url || p.oauth.token,
				client_id : p.client_id
			}, function(r){
				// Encode all the parameters
				return encodeURIComponent(r);
			});

			// Version 1.0a requires the oauth_callback parameter for signing the request
			if( (p.version || p.oauth.version ) ==='1.0a'){
				// Define the OAUTH CALLBACK Parameters
				opts.oauth_callback = oauth_callback;
			}

		}
		else{

			//
			// OAUTH 1: Step 2
			// The provider has provisioned a temporary token
			//

			// Change the path to be that of the Providers token exchange
			path = p.token_url || p.oauth.token;

			opts.oauth_token = p.oauth_token;
			if(p.oauth_verifier){
				opts.oauth_verifier = p.oauth_verifier;
			}

			// Get secret from temp storage
			token_secret = _token_secrets[p.oauth_token];
		}


		//
		// Find the client secret
		// Get the client secret
		//
		self.getCredentials( p.client_id, function(client_secret){

			if(!client_secret){
				callback( p.redirect_uri, {
					error : "signature_invalid",
					error_message : "The signature is not in correct format and not recognized by our system."
				});
				return;
			}

			// Sign the request using the application credentials
			var signed_url = oauth.sign( path, opts, client_secret, token_secret || null);

			// Make the call
			https.get( url.parse(signed_url), function(r){

				console.log("RESPONSE"+r.statusCode);

				var data = '';
				r.on('data', function(chunk){
					data += chunk;
				});

				r.on('end', function(){

					var json = {};
					try{
						json = JSON.parse(data.toString());
					}
					catch(e){
						json = self.utils.param(data.toString());
					}

					if(json.error||r.statusCode===401){

						// Error
						if(!json.error){
							console.log(json);
							json = {error:json.oauth_problem||"401 could not authenticate"};
						}
						callback( p.redirect_uri, json );
					}
					// Was this a preflight request
					else if(!p.oauth_token){
						// Step 1

						// Store the oauth_token_secret
						if(json.oauth_token_secret){
							_token_secrets[json.oauth_token] = json.oauth_token_secret;
						}

						// Great redirect the user to authenticate
						callback( (p.auth_url||p.oauth.auth) + '?' + self.utils.param({
							oauth_token : json.oauth_token,
							oauth_callback : oauth_callback
						}) );
					}

					else{
						// Step 2
						// We should now have everything we need for an access_token
						callback( p.redirect_uri, {
							access_token : json.oauth_token +':'+json.oauth_token_secret+'@'+p.client_id,
							state : p.state
						});
					}

					return;
				});
			}).on('error', function(e) {
				console.error("ERORR");
				console.error(e);
			});
		});
	};


	//
	//
	//
	//
	// UTILITIES
	//
	//
	//
	//

	this.utils = {

		// Log activity
		log : function(p){
			console.log(p);
		},

		//
		// Param
		// Explode/Encode the parameters of an URL string/object
		// @param string s, String to decode
		//
		param : function (s, encode){

			var b,
				a = {},
				m;

			if(typeof(s)==='string'){

				var decode = encode || decodeURIComponent;

				m = s.replace(/^[\#\?]/,'').match(/([^=\/\&]+)=([^\&]+)/g);

				if(m){
					for(var i=0;i<m.length;i++){
						b = m[i].split('=');
						a[b[0]] = decode( b[1] );
					}
				}
				return a;
			}
			else {
				var o = s;
				encode = encode || encodeURIComponent;
			
				a = [];

				for( var x in o ){if(o.hasOwnProperty(x)){
					if( o.hasOwnProperty(x) && o[x] !== null ){
						a.push( [x, o[x] === '?' ? '?' : encode(o[x]) ].join('=') );
					}
				}}

				return a.join('&');
			}
		},


		//
		// merge
		// recursive merge two objects into one, second parameter overides the first
		// @param a array
		//
		merge : function(a,b){
			var x,r = {};
			if( typeof(a) === 'object' && typeof(b) === 'object' ){
				for(x in a){if(a.hasOwnProperty(x)){
					r[x] = a[x];
					if(x in b){
						r[x] = this.merge( a[x], b[x]);
					}
				}}
				for(x in b){if(b.hasOwnProperty(x)){
					if(!(x in a)){
						r[x] = b[x];
					}
				}}
			}
			else{
				r = b;
			}
			return r;
		},

		//
		// Clone
		// Recursively clones an object
		clone : function(obj){
			return this.merge({},obj);
		},


		//
		// filter
		// @param sorts the returning resultset
		//
		filter : function (o){
			if(['string','number'].indexOf(typeof(o))!==-1){
				return o;
			}

			var r = (Array.isArray(o)?[]:{});

			for(var x in o){ if(o.hasOwnProperty(x)){
				if(o[x]!==null){
					if( typeof(x) === 'number' ){
						r.push( this.filter( o[x] ) );
					}
					else{
						r[x] = this.filter(o[x]);
					}
				}
			}}
			return r;
		},

		//
		// empty
		// Checks whether an Array has length 0, an object has no properties etc
		empty : function(o){
			if(this.isObject(o)){
				return Object.keys(o).length === 0;
			}
			if(this.isArray(o)){
				return o.length===0;
			}
			else{
				return !!o;
			}
		},

		//
		// isObject
		isObject : function(o){
			return Object.prototype.toString.call( o ) === '[object Object]';
		},

		//
		// isArray
		isArray : function(o){
			return Array.isArray(o);
		},

		//
		// Args utility
		// Makes it easier to assign parameters, where some are optional
		// @param o object
		// @param a arguments
		//
		args : function(o,args){

			var p = {},
				i = 0,
				t = null, // tag
				m = null, // match
				x = null;
			
			// define x
			for(x in o){if(o.hasOwnProperty(x)){
				break;
			}}

			// Passing in hash object of arguments?
			// Where the first argument can't be an object
			if((args.length===1)&&(typeof(args[0])==='object')&&o[x]!='o!'){
				// return same hash.
				return args[0];
			}

			// else loop through and account for the missing ones.
			for(x in o){if(o.hasOwnProperty(x)){

				t = typeof( args[i] );
				m = o[x];

				if( ( typeof( m ) === 'function' && m.test(args[i]) ) ||
					( typeof( m ) === 'string' && (
						( m.indexOf('s') > -1 && t === 'string' ) ||
						( m.indexOf('o') > -1 && t === 'object' && !Array.isArray(args[i]) ) ||
						( m.indexOf('i') > -1 && t === 'number' ) ||
						( m.indexOf('a') > -1 && t === 'object' && Array.isArray(args[i]) ) ||
						( m.indexOf('f') > -1 && t === 'function' )
					) )
				){
					p[x] = args[i++];
				}
				
				else if( typeof( m ) === 'string' && m.indexOf('!') > -1 ){
					this.log("Whoops! " + x + " not defined");
					return false;
				}
			}}
			return p;
		}
	};
})();