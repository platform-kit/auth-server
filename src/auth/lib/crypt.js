// Nodejs encryption with CTR
var crypto = require('crypto'),
	algorithm = 'aes-256-ctr',
	password = 'd6F3Efeq';

module.exports.encrypt = (json) => {
	var text = JSON.stringify(json);
	var cipher = crypto.createCipher(algorithm, password)
	var crypted = cipher.update(text, 'utf8', 'hex')
	crypted += cipher.final('hex');
	return crypted;
};

module.exports.decrypt = (text) => {
	var decipher = crypto.createDecipher(algorithm, password)
	var dec = decipher.update(text, 'hex', 'utf8')
	dec += decipher.final('utf8');
	var json = JSON.parse(dec);
	return json;
};
