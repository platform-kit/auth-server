// App.build.js
// Put this in the build package of Sublime Text 2
/*
{
	"cmd": ["node", "${file_path:${folder}}/app.build.js", "$file_path"],
	"working_dir" : "${file_path:${folder}}"
}
*/


// The build script creates an index.html file and embeds style and script references inside the code.
// Require IO operations
var buildDist = require('../../_packages/buildDist.js');

buildDist({
	'../bin/index.html' : 'index.html',
	'../bin/redirect.html' : 'redirect.html'
}, {
	// We want to embed all scripts into the HTML document
	embed : true,
	// This is the root directory on the local filesystem where root referenced scripts can be found.
	root_dir : "D:/Projects/"
});