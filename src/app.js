var connect = require('connect');
var serveStatic = require('serve-static');
var DEBUG = !process.env.PORT;
var port = process.env.PORT || 5500;

// Connect to the https server
var app = connect();
app.listen(port);

// Add redirect
app.use(function(req, res, next) {
	res.redirect = function(url){
		res.writeHead(301, {'Location': url});
		res.end();
	};
	next();
});

// ENFORCE SSL
app.use(function(req,res,next){
	var heroku_scheme = req.headers['x-forwarded-proto'];

	if( heroku_scheme && heroku_scheme !== 'https' ){
		res.redirect('https://' + req.headers.host +req.url);
	}
	else{
		next(); /* Continue to other routes if we're not redirecting */
	}
});

// FAVICON
app.use(function(req,res,next){
	if( req.url === '/favicon.ico' ){
		res.redirect('https://adodson.com/favicon.ico');
		return;
	}
	next();
});

// Use the BIN directory as a public static folder
app.use(
	serveStatic( __dirname + '/../static')
);

// Status
// Print out a status message
app.use("/status", require('./status'));

// Listen out for REST API access
// Serve the database
app.use('/rest', require('./rest'));

// Bind handlers for the proxy service
app.use('/proxy', require('./proxy'));

// If its setup correctly...
console.log("HTTP server listening on port "+ port);
