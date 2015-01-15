//
// Gruntfile
//
module.exports = function(grunt) {
	grunt.initConfig({

		shunt : {

			build : {
				'./bin/index.html' : './src/index.html',
				'./bin/redirect.html' : './src/redirect.html',
				'./README.md' : './src/index.html'
			},

			options : {
				// Embed all scripts into the HTML document?	// embed : true,
				embed : true,

				// No, this will break Angular code, which relies on $args
				minify : true,

				// Replace the text
				replace : {
					'http://localhost:5500' : '',
					'"/hello.js/' : '"https://adodson.com/hello.js/',
					'"/adorn/' : '"https://adodson.com/adorn/',
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