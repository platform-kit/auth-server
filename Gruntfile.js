//
// Gruntfile
//
module.exports = function(grunt) {
	grunt.initConfig({

		shunt : {

			build : {
				'./bin/index.html' : './static/index.html',
				'./bin/redirect.html' : './static/redirect.html',
				'./README.md' : './static/index.html',
			},

			options : {
				// Embed all scripts into the HTML document?	// embed : true,
				embed : true,

				// No, this will break Angular code, which relies on $args
				minify : false,

				// This is the root directory on the local filesystem where root referenced scripts can be found.
				// For instance, <script src="/vendor/jquery.js"></script> existed, and was pointing to a file outside this project*
				// (*you might do this if you have a lot of projects)
				// Then this is the full path to the web root.
				root_dir : "../",

				// Replace the text
				replace : {
					'http://localhost:5500' : '',
					'/_packages/angular.min.js' : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js'
				}
			}
		}
	});

	//
	grunt.loadNpmTasks('shunt');

	//
	grunt.registerTask('default', ['shunt']);

};