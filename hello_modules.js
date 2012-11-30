//
// Modules
//
module.exports = {
	'google' : {
		grant_url : 'https://accounts.google.com/o/oauth2/token'
	},
	'facebook' : {
		grant_url : 'https://graph.facebook.com/oauth/access_token'
	},
	'windows' : {
		grant_url : 'https://login.live.com/oauth20_token.srf'
	},
	'github' : {
		grant_url : 'https://github.com/login/oauth/access_token'
	},
	'soundcloud' : {
		grant_url : 'https://api.soundcloud.com/oauth2/token'
	},
	'foursquare' : {
		grant_url : 'https://foursquare.com/oauth2/access_token'
	},
	'flickr' : {
		oauth_version : 1,
		request_url : 'http://www.flickr.com/services/oauth/request_token',
		auth_url : 'http://www.flickr.com/services/oauth/authorize',
		token_url : 'http://www.flickr.com/services/oauth/access_token'
	},
	'twitter' : {
		request_url : "https://twitter.com/oauth/request_token",
		auth_url : "https://twitter.com/oauth/authorize",
		token_url : "https://twitter.com/oauth/access_token"
	},
	'yahoo' : {
		oauth_version : 1,
		request_url : 'https://api.login.yahoo.com/oauth/v2/get_request_token',
		auth_url : function(){
			// constructed from the response above
		},
		token_url : 'https://api.login.yahoo.com/oauth/v2/get_token'
	},
	'dropbox' : {
		oauth_version : 1,
		oauth_signature_method : 'HMAC',
		request_url : 'https://api.dropbox.com/1/oauth/request_token',
		auth_url : 'https://www.dropbox.com/1/oauth/authorize',
		token_url : 'https://api.dropbox.com/1/oauth/access_token'
	}
};