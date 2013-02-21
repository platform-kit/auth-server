var fs = require('fs');
var path = require('path');
var url = require('url');
var hello = require('./hello-server.js');

var port=process.env.PORT || 5500;

var http=require('http');

var pg = require('pg');
var client = new pg.Client(process.env.HEROKU_POSTGRESQL_BLUE_URL||"tcp://postgres:root@localhost/postgres");

console.log("Starting new process");
console.log(process.env.HEROKU_POSTGRESQL_BLUE_URL);

client.connect();

var app = http.createServer(function(req,res){

	var location = url.parse(req.url);
	var pathname = location.pathname;

	if(pathname==="/rest"){

		// Function
		rest(req, function(response){
			var qs = hello.utils.param(location.search||'');
			var body = JSON.stringify(response);
			if(qs&&qs.callback){
				body = qs.callback + "(" + body + ")";
			}
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(body, 'utf-8');
			return;
		});

		return;
	}

	var filePath = '.' + pathname;
	if (filePath == './')
		filePath = './index.html';

	console.log('request starting: ' + filePath);

	var extname = path.extname(filePath);
	var contentType = {
		'js' : 'text/javascript',
		'css' : 'text/css',
		'png' : 'image/png',
		'ogg' : 'audio/ogg',
		'mp3' : 'audio/mpeg3'
	}[extname.replace(/^\./,'')] || 'text/html';

	path.exists(filePath, function(exists) {

		if (exists) {
			fs.readFile(filePath, function(error, content) {
				if (error) {
					res.writeHead(500);
					res.end();
					return;
				}
				else {
					res.writeHead(200, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
					return;
				}
			});
		}
		else if(filePath.indexOf('/')>-1 ){
			res.writeHead(301, { 'Location': "http://adodson.com/"+ filePath});
			res.end();
			return;
		}
		else{
			res.writeHead(404);
			res.end();
			return;
		}
	});

	//res.end();

}).listen(port);




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
				callback( hello.utils.param(body) );
			});
		}
		else{
			callback(null);
		}
	};

	// Get the data
	getData(function(data){

		if(!data.network||!data.client_id||!data.client_secret||!data.admin_id){
			callback({
				error : "Missing data"
			});
			return;
		}

		// Data
		console.log(data);
		// Get all the current stored credentials

		client.query('SELECT admin_id FROM apps '+
			'WHERE service = $1 AND client_id = $2 LIMIT 1',
			[data.network, data.client_id],
			function(err,result){

				console.log(err);
				console.log(result);

				console.log(result.rows[0]);

				if(result.rows.length){
					//Callback
					if( result.rows[0].admin_id !== data.admin_id ){
						callback({
							error : "This client id is associated with another user"
						});
					}
					else{
						client.query('UPDATE apps SET client_secret = $3 '+
							'WHERE service = $1 AND client_id = $2 AND admin_id = $4 LIMIT 1',
							[data.network, data.client_id, data.client_secret, data.admin_id ],
							function(err,result){
								console.log(err);
								console.log(result);
								callback({
									success : "updated"
								});
							});
					}
				}
				else{
					client.query('INSERT INTO apps (service, client_id, client_secret, admin_id) '+
						'VALUES($1,$2,$3,$4)',
						[data.network, data.client_id, data.client_secret, data.admin_id ],
						function(err,result){
							console.log(err);
							console.log(result);
							callback({
								success : "added"
							});
						});
				}
			});
	});
}

//
// HelloJS
//

/*

CREATE TABLE apps (
	service VARCHAR(40),
	client_id VARCHAR(2000),
	client_secret VARCHAR(2000),
	admin_id VARCHAR(2000),
	PRIMARY KEY(service, client_id)
);

INSERT INTO apps (service,client_id,client_secret,admin_id) VALUES
('google', '656984324806-sr0q9vq78tlna4hvhlmcgp2bs2ut8uj8.apps.googleusercontent.com', '-Rc8AL6ZnElTVNq-c9fq9VCH', '' ),
('facebook', '160981280706879', '8a9422bf1d21f7da38e1c9c8492fce40',''),
('facebook', '285836944766385', 'c2d820f98e0b7c71bfafead78f2df93e', ''),
('windows', '00000000400D8578', 'Ik8X3-4ilTiWS-0FD7AkmoHowEqpcXpf',''),
('windows', '000000004405FD31', 'eowTGubQjjlUz63HRclYokptkyG9UySe', ''),
('linkedin', 'exgsps7wo5o7', 'IfAo0uPQwUZ2Kz5o',''),
('github', '7211c5844bdee0247d35', 'e4f03896f58ed140b3c405db3ef67c4fdc932f8f',''),
('github', 'ca7e06a718b2e8eef737', '23d1128fefc919cb004d17249a8f41f77744502c', ''),
('soundcloud','8a4a19f86cdab097fa71a15ab26a01d6', 'e2f1560184003a1cdd8b5bf7c7098e38',''),
('foursquare','3HEXMBQVH2SV0VXUKXOGQRPWH1PUTEIZN4KBDY5L54ZDXCDP', 'N1THQU4WP3G2TRWWNHGNFBUQBUMRMK1R5TG2UTGO2TWVDANB',''),
('flickr', '46dfea40b0f9d3765bc598966b5955d3', 'b16267f09e065859',''),
('twitter', 'eQuyZuECKWPiv3D7E4qdg', 'CnZITQsUKgs8BSUWeKAeQ2QSlIOmKlfDTk8QTLHaY',''),
('twitter', 'SXpuxbSUvgWBhiDfsorsWQ', 'VzbIBESv49WqbG8xExk4BYZFoYO7ZEnFp6yc7mAxQ',''),
('yahoo','dj0yJmk9TTNoTWV6eE5ObW5NJmQ9WVdrOWVtSmhVbk5pTm1VbWNHbzlNVFUxT0RNeU16UTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0yZQ--', '0b79c0a40970abcc2ba15d5bf9edafbbf466dfc7',''),
('dropbox','t5s644xtv7n4oth', 'h9b3uri43axnaid', ''),
('paypal', '07cf80b1a9ad571263c80a5ab81b745f', '2bef3cdcfd799f77','')
;

*/

/*
hello.init({
	'google' : {id:{
		'656984324806-sr0q9vq78tlna4hvhlmcgp2bs2ut8uj8.apps.googleusercontent.com' : '-Rc8AL6ZnElTVNq-c9fq9VCH'
	}},
	'facebook' : {id:{
		// 'adodson.com',
		'160981280706879' : '8a9422bf1d21f7da38e1c9c8492fce40',
		//'local.knarly.com'
		'285836944766385' :'c2d820f98e0b7c71bfafead78f2df93e'
	}},
	'windows' : {id:{
		// 'adodson.com'
		'00000000400D8578' :'Ik8X3-4ilTiWS-0FD7AkmoHowEqpcXpf',
		//'local.knarly.com'
		'000000004405FD31' :'eowTGubQjjlUz63HRclYokptkyG9UySe'
	}},
	'linkedin' : {id:{
		// 'local.knarly.com'
		'exgsps7wo5o7' :'IfAo0uPQwUZ2Kz5o'
	}},

	'github' : {id:{
		// 'adodson.com'
		'7211c5844bdee0247d35' : 'e4f03896f58ed140b3c405db3ef67c4fdc932f8f',
		//'local.knarly.com'
		'ca7e06a718b2e8eef737' : '23d1128fefc919cb004d17249a8f41f77744502c'
	}},
	'soundcloud' : {id:{
		'8a4a19f86cdab097fa71a15ab26a01d6' : 'e2f1560184003a1cdd8b5bf7c7098e38'
	}},
	'foursquare' : {id:{
		'3HEXMBQVH2SV0VXUKXOGQRPWH1PUTEIZN4KBDY5L54ZDXCDP' : 'N1THQU4WP3G2TRWWNHGNFBUQBUMRMK1R5TG2UTGO2TWVDANB'
	}},
	'flickr' : {id:{
		'46dfea40b0f9d3765bc598966b5955d3' : 'b16267f09e065859'
	}},
	'twitter' : {id:{
		// 'adodson.com'
		'eQuyZuECKWPiv3D7E4qdg' : 'CnZITQsUKgs8BSUWeKAeQ2QSlIOmKlfDTk8QTLHaY',
		//'local.knarly.com'
		'SXpuxbSUvgWBhiDfsorsWQ' : 'VzbIBESv49WqbG8xExk4BYZFoYO7ZEnFp6yc7mAxQ'
	}},
	'yahoo' : {id:{
		'dj0yJmk9TTNoTWV6eE5ObW5NJmQ9WVdrOWVtSmhVbk5pTm1VbWNHbzlNVFUxT0RNeU16UTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0yZQ--' : '0b79c0a40970abcc2ba15d5bf9edafbbf466dfc7'
	}},
	'dropbox' : {id:{
		't5s644xtv7n4oth' : 'h9b3uri43axnaid'
	}},
	'paypal' : {id:{
		'07cf80b1a9ad571263c80a5ab81b745f' : '2bef3cdcfd799f77'
	}}
});
*/


//
// Listen for auth calls
// Listen to incoming responses to the path proxy
hello.listen(app,'/proxy');

// Override the exception
hello.on('oauth.exception', function(data,request,response,default_callback){
	var json = {
		client_id : data.query.client_id,
		network : data.query.network,
		error : data.error
	};
	response.writeHead(302, { 'Location': "/#"+hello.utils.param(json) });
	response.end();
});


//
// Override the find a secret method, because this is stored in a database
// Look up the secret from a database
hello.utils.findSecret = function(network,id,callback){

	if(!network||!id){
		callback(null);
	}

	// Get all the current stored credentials
	var query = client.query('SELECT client_secret FROM apps '+
		'WHERE client_id = $1 AND service = $2 LIMIT 1',
		[id, network],
		function(err,result){
			console.log("PANTS");
			if(result.rows.length){
				//Callback
				callback( result.rows[0].client_secret );
			}
			else{
				// So... we haven't found the ID,
				callback(function(res){
					// res
					res.writeHead(302, { 'Location': "/#network="+encodeURIComponent(network)+"&client_id="+encodeURIComponent(id) });
					res.end();
				});
			}

			// End
//				pg.end();
		});
};
