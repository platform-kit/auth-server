// _build.js
// Put this in the build package of Sublime Text 2
/*
{
	"cmd": ["node", "${file_path:${folder}}/app.build.js", "$file_path"],
	"working_dir" : "${file_path:${folder}}"
}
*/


// The build script creates an index.html file and embeds style and script references inside the code.
// Require IO operations
var shunt = require('shunt');

shunt({
	'../bin/index.html' : 'index.html',
	'../bin/redirect.html' : 'redirect.html',
	'../README.md' : 'index.html'
}, {
	// Embed all scripts into the HTML document?	// embed : true,
	embed : true,

	// No, this will break Angular code, which relies on $args
	minify : false,

	// This is the root directory on the local filesystem where root referenced scripts can be found.
	// For instance, <script src="/vendor/jquery.js"></script> existed, and was pointing to a file outside this project*
	// (*you might do this if you have a lot of projects)
	// Then this is the full path to the web root.
	root_dir : "../../",

	// Replace the text
	replace : {
		'http://localhost:5500' : '',
		'/_packages/angular.min.js' : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.0.6/angular.min.js',
		'/hello.js/dist/hello.all.min.js' : 'https://mrswitch.github.com/hello.js/dist/hello.all.min.js'
	}
});