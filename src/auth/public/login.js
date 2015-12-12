/*global HELLO_CLIENT_IDS, hello, login*/
/*eslint no-unused-vars: 0*/
// Login script
(function(window) {

// hello.init(HELLO_CLIENT_IDS, {
// 	redirect_uri: './redirect',
// 	response_type: 'code',
// 	display: 'page',
// 	oauth_proxy: './redirect'
// });

var paths = {
	google: 'https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/plus.me profile email',
	github: 'https://github.com/login/oauth/authorize?scope=user:email',
	windows: 'https://login.live.com/oauth20_authorize.srf?scope=wl.signin,wl.basic,wl.emails',
	facebook: 'https://www.facebook.com/dialog/oauth/?scope=email',
	yahoo: 'redirect?',
	twitter: 'redirect?'
}

var redirect_uri = window.location.href.replace(/(\?|\#).*$/, '').replace(/\/[^\/]+$/, '/redirect');

window.login = function(network) {

	var state = {
		redirect_uri: redirect_uri
	};

	var client_id = HELLO_CLIENT_IDS[network];
	if (network === 'yahoo') {
		state.oauth = {
			version: '1.0a',
			auth: 'https://api.login.yahoo.com/oauth/v2/request_auth',
			request: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
			token: 'https://api.login.yahoo.com/oauth/v2/get_token'
		};
	}
	state.network = network;
	state.client_id = client_id;
	window.location.href = paths[network] + '&client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect_uri) + '&response_type=code&state=' + encodeURIComponent(JSON.stringify(state));
}

})(window);
