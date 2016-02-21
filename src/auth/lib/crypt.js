'use strict';

// Nodejs encryption with CTR
let crypto = require('crypto');
let algorithm = 'aes-256-ctr';
let password = 'd6F3Efeq';

module.exports.encrypt = json => {
	let text = JSON.stringify(json);
	let cipher = crypto.createCipher(algorithm, password)
	let crypted = cipher.update(text, 'utf8', 'hex')
	crypted += cipher.final('hex');
	return crypted;
};

module.exports.decrypt = text => {
	let decipher = crypto.createDecipher(algorithm, password)
	let dec = decipher.update(text, 'hex', 'utf8')
	dec += decipher.final('utf8');
	let json = JSON.parse(dec);
	return json;
};
