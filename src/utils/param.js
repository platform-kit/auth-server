'use strict';

// Param
// Explode/Encode the parameters of an URL string/object
// @param string s, String to decode
module.exports = (s, encode) => {

	if (typeof(s) === 'string') {

		var decode = encode || decodeURIComponent;

		let m = s.replace(/^[\#\?]/, '').match(/([^=\/\&]+)=([^\&]+)/g);

		let a = {};

		if (m) {
			m.forEach((item) => {
				let b = item.split('=');
				a[b[0]] = decode(b[1]);
			});
		}

		return a;
	}
	else {

		encode = encode || encodeURIComponent;

		let o = s;

		let a = [];

		for (var x in o) {
			if (o.hasOwnProperty(x) && o[x] !== null) {
				a.push([x, o[x] === '?' ? '?' : encode(o[x])].join('='));
			}
		}

		return a.join('&');
	}
};
