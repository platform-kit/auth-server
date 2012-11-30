var https = require('https');
var url = require('url');
var hello_modules = require('./hello_modules.js');
//var oa = require('oauth').OAuth;

// Set our API object as exportablee
module.exports = new (function(){

	// Add the modules
	var services = hello_modules;

	// Define self
	var self = this;

	//
	// Define the environments
	//
	this.init = function(obj){
		services = this.utils.merge(services, obj);
	};

	//
	// Login
	//
	this.login = function(obj, callback){

		// Take the obj and make a call to the server
		var p = this.utils.merge( services[obj.network], obj);

		if(	p.oauth_version === 1 ){
			return;
		}

		var opts = url.parse(p.grant_url);
		opts.method = 'POST';

		console.log(opts);

		this.utils.log(p.grant_url);

/*
		opts.path = 'http://' + opts.host + ':' + opts.port + opts.path;
		opts.headers = opts.headers||{};
		opts.headers.host = opts.host;
		opts.host = '127.0.0.1';
		opts.port = 8888;
*/
		// Make the OAuth2 request
		var post = this.utils.param({
			code : p.code,
			client_id : p.id,
			client_secret : p.secret,
			grant_type : 'authorization_code',
			redirect_uri : encodeURIComponent(p.redirect_uri)
		}, function(r){return r;});

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

		this.utils.log( post );
		req.write( post );

		req.end();
	};


	//
	// Bind to an existing request
	this.listen = function(server){

		// Store old Listeners
		var oldListeners = server.listeners('request');
		server.removeAllListeners('request');

		var self = this;

		server.on('request', function (req, res) {

			// if the querystring includes
			// An authentication "code",
			// client_id e.g. "1231232123",
			// response_uri, "1231232123",
			var p = self.utils.param(url.parse(req.url).search);

			var state = p.state;

			if(state&&state.match(/^\{.*\}$/)){
				// decompose the p.state, redefine p
				p = self.utils.merge( p, JSON.parse(state) );
				p.state = state; // set this back to the string
			}

			//
			// OAUTH2
			//
			if( p.code && p.state && p.redirect_uri ){


				self.login( p, function(auth){

					// Redirect page
					// With the Auth response, we need to return it to the parent
					var url = p.redirect_uri + '#'+ self.utils.param(self.utils.merge({state:p.state, expires_in:3600}, auth));
					res.writeHead(302, { 'Location': url });
					res.end();
					return;

				});
				return;
			}

			//
			// OAUTH1
			//
			else if( p.network in services &&
					p.redirect_uri &&
					services[p.network].oauth_version === 1 ){

				//
				// Get the Authorization path
				//
				p = self.utils.merge(services[p.network], p);

				console.log(p);

				getOAuth( p, function(json){
					console.log(json);
					if("xoauth_request_auth_url" in json){
						res.writeHead(302, { 'Location': json.xoauth_request_auth_url });
						console.log(json.xoauth_request_auth_url);
						res.end();
					}
					else if(json.oauth_token){
						//res.writeHead(200, { 'Location': p.redirect_uri + '#'+ hello.utils.param(auth) });
						res.write(p.redirect_uri + '#'+ self.utils.param({
							access_token : json.oauth_token,
							state : self.utils.param(p)
						}));
						res.end();
					}
				});
				return;
			}

			// Lets let something else handle this.
			// Trigger all oldListeners
			for (var i = 0, l = oldListeners.length; i < l; i++) {
				oldListeners[i].call(server, req, res);
			}
		});
	};


	// token=>secret lookup
	var _token_secrets = {};
	function getOAuth(opts, callback){

		var query = self.utils.param({
			oauth_consumer_key : opts.id,
			oauth_nonce : parseInt(Math.random()*1e20,10).toString(16),
			oauth_timestamp : parseInt((new Date()).getTime()/1000,10),
			oauth_signature_method : p.oauth_signature_method || 'plaintext',
			oauth_signature : opts.secret + "%26" + (_token_secrets[opts.token]||''),
			oauth_token : opts.token,
			oauth_verifier : opts.verifier,
			oauth_version : '1.0',
			oauth_callback : !opts.token ? encodeURIComponent(opts.redirect_uri+'?network='+opts.network) : null
		}, function(r){return r;});

		var path = (opts.token&&opts.token_url?opts.token_url:opts.request_url);
		console.log(path);

		opts = url.parse( path +'?'+query);

		console.log(path +'?'+query);

		https.get(opts, function(res){
			res.on('data', function(chunk){
				var json = self.utils.param(chunk.toString());
				if(json.oauth_token_secret){
					_token_secrets[json.oauth_token] = json.oauth_token_secret;
				}
				callback( json );
			});
		});
	}

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