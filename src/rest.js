'use strict';
var debug = require('debug')('rest');

// REST
// Defines the Web API for managing the site
var connect = require('connect');
var db = require('./db');
var param = require('../lib/utils/param');
var url = require('url');
var dear = require('dear');

// Initiate the yahoo API
dear.init({
	yahoo: {
		client_id: process.env.YAHOO_ID,
		client_secret: process.env.YAHOO_SECRET
	}
});

// Initiate the DB table
db.table = 'apps';

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

// Export this module as middleware
var app = module.exports = connect();

app.use(function(req, res) {

	new Rest(req, res);

});


function Rest(req, res) {

	// CORS
	// Handle each API response with some cross domain headers
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
		'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
	});

	this.req = req;
	this.res = res;
	this.body(this.init.bind(this));
}

Rest.prototype.serve = function(response) {

	// Return JSON
	var body = JSON.stringify(response);

	// Does the request ask for JSONP response?
	// Get the callback parameter with the request
	var location = url.parse(this.req.url);
	var qs = param(location.search || '');
	if (qs && qs.callback) {
		body = qs.callback + '(' + body + ')';
	}

	// Finally, respond
	this.res.end(body, 'utf-8');
}

Rest.prototype.error = function(message) {
	return this.serve({
		error: message
	});
}

// REST API
// The REST API serves the interface for getting and saving application data
Rest.prototype.init = function(method, data) {

	// QueryString
	var location = url.parse(this.req.url);
	var qs = param(location.search || '');
	var _this = this;
	var callback = this.serve.bind(this);

	// Get request
	if (data === null) {

		if (qs.action === 'delete') {
			db.delete({guid: qs.guid}, callback);
			return;
		}


		// Ensure we have identifed the user
		if (!qs.access_token || !qs.admin_id) {
			return this.error('access_token and user id required');
		}

		// Check that the access_token is valid and matches the user id given
		// Abstract the service and the access_token from the URL
		var cred = qs.admin_id.split('@');
		var user_id = cred[0];
		var network = cred[1];


		dear(network)
		.api('me', {access_token: qs.access_token})
		.then(function(r) {

			if (r.id !== user_id) {
				return _this.error('Access token does not match credential for ' + user_id);
			}

			// Get the apps that they have registered
			db.query('SELECT * FROM apps ' +
				'WHERE admin_id SIMILAR TO $1',
				['%\\m' + qs.admin_id + '\\M%'],
				function(err, result) {
					callback(result);
				});

		}, function(e) {
			callback(e.error.message);
		})
		.then(null, function(e) {
			callback(e.message);
		});

	}
	else {

		if (!data.guid) {
			db.insert(data, function(err, result) {
				debug(err || result.rows[0]);
				callback(err || result.rows[0]);
			});
		}
		else {
			db.update(data, {guid: data.guid}, function(err, result) {
				callback(result);
			});
		}

	}
};


Rest.prototype.body = function(next) {

	var req = this.req;
	var body = '';

	if (req.method === 'POST') {

		req.on('data', function(data) {
			body += data;
		});

		req.on('end', function() {
			try {
				body = JSON.parse(body);
			}
			catch (e) {
				param(body);
			}
			next(req.method, body);
		});
	}
	else {
		next(req.method, null);
	}
};
