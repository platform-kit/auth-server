module.exports = [
	{
		'name': 'facebook',
		'domain': 'local.knarly.com auth-server.herokuapp.com',
		'client_id': process.env.FACEBOOK_ID,
		'client_secret': process.env.FACEBOOK_SECRET,
		'grant_url': 'https://graph.facebook.com/oauth/access_token'
	},
	{
		'name': 'github',
		'domain': 'localhost auth-server.herokuapp.com',
		'client_id': process.env.GITHUB_ID,
		'client_secret': process.env.GITHUB_SECRET,
		'grant_url': 'https://github.com/login/oauth/access_token'
	},
	{
		'name': 'google',
		'domain': 'localhost auth-server.herokuapp.com',
		'client_id': process.env.GOOGLE_ID,
		'client_secret': process.env.GOOGLE_SECRET,
		'grant_url': 'https://accounts.google.com/o/oauth2/token'
	},
	{
		'name': 'twitter',
		'domain': 'localhost auth-server.herokuapp.com',
		'client_id': process.env.TWITTER_ID,
		'client_secret': process.env.TWITTER_SECRET,
		'grant_url': 'https://api.twitter.com/oauth/access_token'
	},
	{
		'name': 'windows',
		'domain': 'local.knarly.com auth-server.herokuapp.com',
		'client_id': process.env.WINDOWS_ID,
		'client_secret': process.env.WINDOWS_SECRET,
		'grant_url': 'https://login.live.com/oauth20_token.srf'
	},
	{
		'name': 'yahoo',
		'domain': 'local.knarly.com auth-server.herokuapp.com',
		'client_id': process.env.YAHOO_ID,
		'client_secret': process.env.YAHOO_SECRET,
		'grant_url': ''
	}
];
