var fs = require('fs');
var path = require('path');
var url = require('url');
var hello = require('./hello-server.js');

var port=process.env.PORT || 5500;
var http=require('http');

var dev = 0+(!process.env.PORT);

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
	}}
});


var app = http.createServer(function(req,res){

	var filePath = '.' + req.url;
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

// Listen to incoming responses
hello.listen(app);