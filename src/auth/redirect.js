'use strict';
var debug = require('debug')('redirect');

// login
// Expose the login page for session management

var promisify = require('promisify-node');
var db = require('../api/db');
var oauthshim = require('../../lib/oauth-shim');

// Export this module as middleware
var app = module.exports = require('express')();

// Jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Get the Services which we're going to identify with
var AuthServices = {
	facebook: [2, require('passport-facebook').Strategy, (data) => {if (data.id) {data.picture = 'https://graph.facebook.com/' + data.id + '/picture';}}],
	github: [2, require('passport-github').Strategy, (data) => {data.picture = data._json.avatar_url;}],
	google: [2, require('passport-google-oauth').OAuth2Strategy, (data) => {if (data.photos && data.photos.length) data.picture = data.photos[0].value;}],
	// linkedin: [1, require('passport-linkedin').Strategy],
	twitter: [1, require('passport-twitter').Strategy, () => {}],
	windows: [2, require('passport-windowslive').Strategy, (data) => {if (data.photos && data.photos.length) data.picture = data.photos[0].value;}],
	yahoo: [1, require('passport-yahoo-oauth').Strategy, (data) => {}]
}

// INSTALL
// Create a new file called 'credentials.json', with a key value object literal {client_id => client_secret, ...}

// OAuth-Shim
// Configure OAuth-Shim with the credentials to use.
var creds = require('./credentials.js');

// Passport Profile
// Configure PassportJS's Google service
var strategies = {};
creds.forEach((cred) => {

	var network = cred.name;
	var service = AuthServices[network];

	if (!service) {
		throw 'Could not find Auth Service for ' + network;
	}

	var service_oauth_version = service[0];
	var constructor = service[1];

	if (service_oauth_version === 2) {
		strategies[network] = new constructor({
			clientID: cred.client_id,
			clientSecret: cred.client_secret,
			callbackURL: 'https://blank'
		}, () => {
			debug(arguments);
		});
	}
	else if (service_oauth_version === 1) {
		strategies[network] = new constructor({
			consumerKey: cred.client_id,
			consumerSecret: cred.client_secret,
			callbackURL: 'https://blank'
		}, () => {
			debug(arguments);
		});
	}
});

// '/redirect' is the path of the OAuth Shim
app.all('*',

	// Get some initial information about the incoming request
	(req, res, next) => {

		// Add additional information to the state parameter
		if (req.query.state) {
			let state = JSON.parse(req.query.state);
			let network = state.network;
			if (!state.oauth) {
				req.query.oauth = {
					grant: strategies[network]._oauth2._accessTokenUrl
				};
			}
		}

		next();
	},

	// An incoming request will have an OAuth response like ?code=123
	// oauthshim.interpret will make the exchange for a token using this request
	oauthshim.interpret,

	// Capture the response AccessToken
	// Request got User Profile Data
	handleGrantedAuthorization,

	// Intercept OAuth2
	(req, res, next) => {
		if (req.oauthshim && req.oauthshim.redirect && req.oauthshim.data.access_token) {
			// Put the original request back together...
			// This is a relative path since this feature is relative.
			res.redirect('.' + req.session.authRequest);
		}
		else{
			next();
		}
	},

	// oauthshim.redirect used by OAuth1 to redirect signed login requests
	oauthshim.redirect,

	// Contengency
	// If user cancels federated authentication
	// Either the redirect page has redirected the agent too a thirdparty login
	// Or the user has been identified and is prompted to login.
	(req, res) => {

		// Redirect to a page which contains HelloJS clientside script
		// To Store the credentials in the client
		// To Trigger any callbacks attached to the login
		res.redirect('./login?error=undefined');
//		res.end();
	}
);


// Was the login for this server
// auth-server maintains its own list of users
function handleGrantedAuthorization(req, res, next) {

	if (req.oauthshim && req.oauthshim.data && req.oauthshim.redirect) {

		var data = req.oauthshim.data;
		var opts = req.oauthshim.options;

		// Was this an OAuth Login response and does it contain a new access_token?
		if ('access_token' in data && !('path' in opts)) {

			// What is the network name
			var network = toJSON(data.state).network;

			// Store this access_token
			debug('Session created', network, data.access_token.substr(0, 8) + '...');

			// Promisify the passport strategies
			var chain = promisify(strategies[network].userProfile).bind(strategies[network])

			// Is this an OAuth1 requesst
			var a = data.access_token.split(/[\:\@]/);

			// Make request for a User Profile
			if (a.length > 1) {

				data.oauth_token = a[0];
				data.oauth_token_secret = a[1];

				debug('OAuth1', data);
				chain = chain(data.oauth_token, data.oauth_token_secret, data);
			}
			else {
				chain = chain(data.access_token);
			}

			// Format profile response
			chain.then((data) => {
				//
				debug(data);
				// format the response
				if (data) {
					AuthServices[network][2](data);
				}
				return data;
			})
			// Handle the profile data
			.then((profileData) => {

				// Match the user with the profile data
				return setProfileToSession(network, req.session.user_id, profileData)
				.then((user_id) => {
					debug('Session set user_id', user_id);
					// Save this users data to the session
					req.session.connections[network] = profileData;
					req.session.user_id = user_id;

				});
			})
			//
			.then(() => {
				// Continue back to the authorization page
				next();
			},
			(err) => {

				// Log error
				debug(err);

				// Initiate the properties which are passed to the rendered document
				let options = {
					session: req.session
				};

				// Duplicate?
				if (err.message && err.message.match('duplicate')) {
					// Error: the connection being linked is assigned to another account
					options.message = 'Snap, this connection is linked to another account. \
										It will have to be unlinked from the other account before it can be associated with this account';
				}

				// Display error page
				res.render('error', options);
			});
		}
		else {
			next();
		}
	}
	else {
		next();
	}
}


function toJSON(str) {
	try {
		return JSON.parse(str);
	}
	catch (e) {
		return {};
	}
}

function setProfileToSession(network, userId, profileData) {

	// Recieved profile Data
	debug(profileData);

	// If the current user is signed in...
	if (userId) {
		// Update the current users connection
		return getUserById(userId).then((userData) => {
			return updateUserConnection(network, userData, profileData);
		});
	}

	// The user has not be defined.
	// Retrieve the the user whom has this connection
	return getUserByConnectionId(network, profileData.id)
	.then((userData) => {

		// Get userID
		let userId = userData ? userData.id : undefined;

		// If the user was not found...
		if (!userId) {
			// Create a new user from session data
			return createUserFromConnection(network, profileData);
		}

		else {
			return updateUserConnection(network, userData, profileData);
		}

	}).then((userId) => {
		debug('Acquired User', userId);
		return userId;
	});
}


function getUserById(userId) {

	return db('users').get(['*'], {id: userId});
}

function getUserByConnectionId(network, conn_id) {

	return db.query('SELECT * FROM users WHERE ' + network + '_id LIKE \'%' + conn_id + '%\' LIMIT 1')
	.then((data) => {
		return data.rows.length ? data.rows[0] : undefined;
	});
}

function createUserFromConnection(network, profileData) {

	debug('Create user');

	let post = {
		name: profileData.displayName,
		picture: profileData.picture
	};
	post[network + '_id'] = profileData.id;
	post[network + '_profile'] = JSON.stringify(profileData);

	return db('users')
	.insert(post)
	.then((data) => {
		// Found the user, associate this session with them
		return data.id;
	});
}

function updateUserConnection(network, userData, profileData) {

	let cond = {id: userData.id};

	let post = {};

	post[network + '_id'] = profileData.id;
	post[network + '_profile'] = JSON.stringify(profileData);

	if (!userData.name && profileData.displayName) {
		post.name = profileData.displayName;
	}

	if (!userData.picture && profileData.picture) {
		post.picture = profileData.picture;
	}

	debug('Updating user connection');

	return db('users')
	.update(post, cond)
	.then(() => {
		// Found the user, associate this session with them
		return userData.id;
	});
}
