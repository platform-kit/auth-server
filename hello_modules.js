//
// Modules
//
module.exports = {
	'google' : {
		oauth : {
			grant : 'https://accounts.google.com/o/oauth2/token'
		}
	},
	'facebook' : {
		oauth : {
			grant : 'https://graph.facebook.com/oauth/access_token'
		}
	},
	'windows' : {
		oauth : {
			grant : 'https://login.live.com/oauth20_token.srf'
		}
	},
	'github' : {
		oauth : {
			grant : 'https://github.com/login/oauth/access_token'
		}
	},
	'soundcloud' : {
		oauth : {
			grant : 'https://api.soundcloud.com/oauth2/token'
		}
	},
	'foursquare' : {
		oauth : {
			grant : 'https://foursquare.com/oauth2/access_token'
		}
	},
	'flickr' : {
		oauth : {
			version : 1,
			request : 'http://www.flickr.com/services/oauth/request_token',
			auth : 'http://www.flickr.com/services/oauth/authorize',
			token : 'http://www.flickr.com/services/oauth/access_token'
		}
	},
	'twitter' : {
		oauth : {
			request : "https://twitter.com/oauth/request_token",
			auth : "https://twitter.com/oauth/authorize",
			token : "https://twitter.com/oauth/access_token"
		}
	},
	'yahoo' : {
		oauth : {
			version : 1,
			request : 'https://api.login.yahoo.com/oauth/v2/get_request_token',
			auth : function(){
				// constructed from the response above
			},
			token : 'https://api.login.yahoo.com/oauth/v2/get_token'
		}
	},
	'dropbox' : {
		oauth : {
			version : 1,
			request : 'https://api.dropbox.com/1/oauth/request_token',
			auth : 'https://www.dropbox.com/1/oauth/authorize',
			token : 'https://api.dropbox.com/1/oauth/access_token'
		}
	}
};