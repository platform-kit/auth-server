'use strict';
var debug = require('debug')('auth');

// Export this module as middleware
var app = module.exports = require('express')();

// Jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Static files
app.use(require('serve-static')(__dirname + '/public'));

// Session data
app.use(require('express-session')({
	secret: 'test',
	resave: false,
	saveUninitialized: true
}));

app.use(function(req, res, next) {
	if (!req.session) {
		req.session = {};
	}
	if (!req.session.connections) {
		req.session.connections = {};
	}
	next();
});

// Bind handlers for the proxy service
app.all('/login', require('./login'));

// Bind handlers for the proxy service
app.all('/redirect', require('./redirect'));

// Notice
debug('auth ready');
