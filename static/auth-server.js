/*global hello*/
(function(hello) {

	// Setup a link with the current
	var base = '//' + window.location.hostname + '/';

	hello.init({
		authserver: {
			name: 'Auth Server',
			oauth: {
				version: 2,
				auth: base + 'auth/login',
				grant: base + 'auth/token'
			},
			refresh: true,
			base: base + 'api/',
			get: {
				me: 'me'
			},
			xhr: function(p) {
				if (p.method !== 'get' && p.data) {
					// Serialize payload as JSON
					p.headers = p.headers || {};
					p.headers['Content-Type'] = 'application/json';
					if (typeof (p.data) === 'object') {
						p.data = JSON.stringify(p.data);
					}
				}
				return true;
			}
		}
	});

})(hello);
