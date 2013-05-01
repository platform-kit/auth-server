var oauth = require('./oauth.js');
var callback = 'http://location.com/?wicked=knarly&redirect_uri='+
			encodeURIComponent("http://local.knarly.com/hello.js/redirect.html"+
				"?state="+encodeURIComponent(JSON.stringify({proxy:"http://localhost"})));

console.log(callback);

var test = 'http://location.com/?wicked=knarly&redirect_uri=http%3A%2F%2Flocal.knarly.com%2Fhello.js%2Fredirect.html%3Fstate%3D%257B%2522proxy%2522%253A%2522http%253A%252F%252Flocalhost%2522%257D';
if(callback === test){
	console.log("Passed");
}
else
	console.log(test);

var sign = oauth.sign('https://api.dropbox.com/1/oauth/request_token', {'oauth_consumer_key':'t5s644xtv7n4oth', 'oauth_callback':callback}, 'h9b3uri43axnaid', '', '1354345524');
console.log(sign);

var test = "https://api.dropbox.com/1/oauth/request_token?oauth_callback=http%3A%2F%2Flocation.com%2F%3Fwicked%3Dknarly%26redirect_uri%3Dhttp%253A%252F%252Flocal.knarly.com%252Fhello.js%252Fredirect.html%253Fstate%253D%25257B%252522proxy%252522%25253A%252522http%25253A%25252F%25252Flocalhost%252522%25257D&oauth_consumer_key=t5s644xtv7n4oth&oauth_nonce=1354345524&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1354345524&oauth_version=1.0&oauth_signature=7hCq53%2Bcl5PBpKbCa%2FdfMtlGkS8%3D";
if( sign === test){
	console.log('passed');
}
else
	console.log(test);
