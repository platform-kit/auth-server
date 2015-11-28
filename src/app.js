'use strict';
var debug = require('debug')('app');
var connect = require('connect');
var serveStatic = require('serve-static');
var port = process.env.PORT || 5500;

// Connect to the https server
var app = connect();
app.listen(port);

// Add redirect
app.use(require('./utils/http_extend_redirect'));

// ENFORCE SSL
app.use(require('./utils/http_enforce_ssl'));

// FAVICON
app.use((req, res, next) => {
	if (req.url === '/favicon.ico') {
		res.redirect('https://adodson.com/favicon.ico');
		return;
	}
	next();
});

// Static files
app.use(serveStatic(__dirname + '/../static'));

// Status
// Print out a status message
app.use('/status', require('./status'));

// Listen out for REST API access
// Serve the database
app.use('/rest', require('./rest'));

// Bind handlers for the proxy service
app.use('/proxy', require('./proxy'));

// If its setup correctly...
debug('HTTP server listening on port ' + port);
