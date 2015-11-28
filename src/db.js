'use strict';

var debug = require('debug')('db');
var pg = require('pg');
var conn = process.env.HEROKU_POSTGRESQL_BLUE_URL || 'tcp://postgres:root@localhost/auth-server';

module.exports = new DB(conn);

function DB(conn) {
	if (!(this instanceof DB)) {
		return new DB();
	}

	this.client = new pg.Client(conn);
	this.client.connect((err) => {
		// Connected to DB?
		if (err) {
			return debug('Failed to connected to POSTGRESQL ' + conn, err);
		}
		else {
			debug('Connected to POSTGRESQL ' + conn);
		}
	});
}

// Default table
DB.prototype.table = 'apps';

// Extend the default database
DB.prototype.query = function() {
	return this.client.query.apply(this.client, arguments);
};

// Insert
DB.prototype.insert = function(data, callback) {

	var keys = [],
		values = [],
		temp = [],
		i = 1;

	for (let x in data) {
		keys.push(x);
		temp.push('$' + i++);
		values.push(data[x]);
	}
	var sql = 'INSERT INTO ' + this.table + '(' + keys.join(',') + ') VALUES( ' + temp.join(',') + ' ) RETURNING *';
	debug(sql);
	return this.query(sql, values, callback);
};

DB.prototype.update = function(data, cond, callback) {

	var set = [],
		values = [],
		where = [],
		i = 1;

	for (let x in data) {
		set.push(x + ' = $' + i++);
		values.push(data[x]);
	}
	for (let x in cond) {
		where.push(x + ' = $' + i++);
		values.push(cond[x]);
	}
	var sql = 'UPDATE ' + this.table + ' SET ' + set.join(',') + ' WHERE ' + where.join(' AND ');
	debug(sql);
	return this.query(sql, values, callback);
};


DB.prototype.delete = function(cond, callback) {

	var values = [],
		where = [],
		i = 1;

	for (let x in cond) {
		where.push(x + ' = $' + i++);
		values.push(cond[x]);
	}

	var sql = 'DELETE FROM ' + this.table + ' WHERE ' + where.join(' AND ');
	debug(sql);
	return this.query(sql, values, callback);
};
