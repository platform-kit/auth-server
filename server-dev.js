// Load developer environment variables
require('dotenv').config({path: './.env.dev'});

// Include the server as usual
require('./server');
