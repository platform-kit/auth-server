'use strict';
var debug = require('debug')('login');

// login
// Expose the login page for session management

var promisify = require('promisify-node');
var db = require('../api/db');
var qs = require('querystring');
var crypt = require('./lib/crypt');

// Export this module as middleware
var app = module.exports = require('express')();

// Jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// OAuth-Shim
// Configure OAuth-Shim with the credentials to use.
var creds = require('./credentials.js');

// Convert credentials into client_ids for HelloJS
var client_ids = {};
creds.forEach((cred) => {
	client_ids[cred.name] = cred.client_id;
});

// Bind handler to this
app.use((req, res, next) => {
	// Store the Request in the session for redirecting too this page after affiliate login.
	req.session.authRequest = req.url;

	// Default chain
	let chain = Promise.resolve(null);
	let userId = req.session ? req.session.user_id : undefined;
	let clientId = req.query.client_id;

	// Debug
	debug('Building login page');

	// Get the current connections for this user allocated
	if (userId) {
		chain = getUser(userId);
	}

	// Send back to the system
	chain.then((user) => {

		debug('Render login page for', userId);

		// AuthResponse
		let authResponse = getAuthResponse(userId, clientId);
		authResponse.state = req.query.state;

		// Render the login page
		res.render('login', {
			client_ids: client_ids,
			user: user,
			query: req.query,
			auth_response: userId && clientId ? qs.stringify(authResponse) : undefined
		});
	}).then(null, (err) => {

		debug(err);
		next();

		res.end();
	});
});

// Debug
debug('auth/login ready');

// Get User Connections
function getUser(userId) {

	debug('Read user profile', userId);

	return db('users')
	.get(['*'], {id: userId})
	.then((user) => {

		debug('Acquired user data');

		// Ensure we got a response
		if (user) {

			// Transpile user data
			user.connections = {};

			for (let x in user) {

				// Is this a connection entry?
				// There will be two properties, network'_id' and network'_profile'
				if (x.match(/_profile$/)) {
					let network = x.match(/^[^_]+/)[0];
					user.connections[network] = JSON.parse(user[x]);
				}
			}
		}

		return user;
	});
}

function getAuthResponse(user_id, client_id) {
	// authResponse
	let authResponse = {
		expires_in: 3600
	};

	// Generate an AuthResponse for this user...
	authResponse.access_token = crypt.encrypt({
		expires: Date.now() + (authResponse.expires_in * 1000),
		user_id: user_id,
		client_id: client_id
	});

	return authResponse;
}
