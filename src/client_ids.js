//
// Client IDS
// Defines the CLIENT_ID (AppID's) of the OAuth2 providers
// relative to the domain host where this code is presented.

// Register your domain with Facebook at  and add here

// Register your domain with Windows Live at http://manage.dev.live.com and add here

// To make it a little easier
var CLIENT_IDS = {
	google : '656984324806-sr0q9vq78tlna4hvhlmcgp2bs2ut8uj8.apps.googleusercontent.com',
	windows : {
		'adodson.com' : '00000000400D8578',
		'local.knarly.com' : '000000004405FD31',
		'auth-server.herokuapp.com' : '000000004C0DFA39'
	}[window.location.hostname],
	facebook : {
		'adodson.com' : '160981280706879',
		'local.knarly.com' : '285836944766385',
		'auth-server.herokuapp.com' : '115601335281241'
	}[window.location.hostname],
	yahoo : {
		'local.knarly.com' : 'dj0yJmk9TTNoTWV6eE5ObW5NJmQ9WVdrOWVtSmhVbk5pTm1VbWNHbzlNVFUxT0RNeU16UTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0yZQ--',
		'adodson.com' : 'dj0yJmk9TWtNN0ppYTBGSW1vJmQ9WVdrOVIxSnhUVVJsTlRJbWNHbzlOamMxT1RVM01UWXkmcz1jb25zdW1lcnNlY3JldCZ4PWNk',
		'auth-server.herokuapp.com' : 'dj0yJmk9M1JuUWFaRHl5U01nJmQ9WVdrOWMzZHBVRFJsTXpJbWNHbzlNVEExTURVeE5qYzJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0wNg--'
	}[window.location.hostname]
};

var REDIRECT_URI = {
	'local.knarly.com' : '/hello.js/redirect.html'
}[window.location.host] || './redirect.html';