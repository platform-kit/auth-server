'use strict';

var debug = require('debug')('db');
var pg = require('pg');
var promisify = require('promisify-node');
var conn = process.env.HEROKU_POSTGRESQL_BLUE_URL || 'tcp://postgres:root@localhost/auth-server';
var client;

// Export the function DB
module.exports = DB;

function DB(table) {
	return DB.use(table);
}

// Set the table
DB.use = function(table) {
	this.table = table;
	return this;
};

// Run the query
DB.query = function(sql, cond) {

	debug(sql, cond);

	if (client) {
		// Return the client promise
		return client.apply(client, arguments);
	}

	return new Promise((resolve, reject) => {
		// Set the client
		let agent = new pg.Client(conn);
		agent.connect((err) => {

			// Connected to DB?
			if (err) {
				debug('Failed to connected to POSTGRESQL ' + conn, err);
				reject('Failed to connect to DB');
				return;
			}

			// Connected
			debug('Connected to POSTGRESQL ' + conn);

			// Define the client, we dont want to check this everytime
			client = promisify(agent.query).bind(agent);

			// Run the query
			client.apply(client, arguments).then((resp) => {
				debug(resp);
				resolve(resp);
			}, (err) => {
				debug(err);
				reject(err);
			});
		});
	});
}

// Get
DB.get = function(fields, cond) {
	return this.getAll(fields, cond, {limit: 1})
	.then((data) => {
		if (data && data.rows && data.rows.length) {
			return data.rows[0];
		}
		return null;
	});
};

DB.getAll = function(fields, cond, options) {

	let i = 1;
	let where = [];
	let values = [];
	let opts = [];

	for (let x in cond) {
		where.push(x + ' = $' + i++);
		values.push(cond[x]);
	}

	for (let x in options) {
		opts.push(x + ' ' + options[x]);
	}

	return this.query('SELECT ' + fields.join(',') + ' FROM ' + this.table + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ' + opts.join(' '), values);
};

// Insert
DB.insert = function(data) {

	var keys = [],
		values = [],
		temp = [],
		i = 1;

	for (let x in data) {
		keys.push(x);
		temp.push('$' + i++);
		values.push(data[x]);
	}
	return this.query('INSERT INTO ' + this.table + '(' + keys.join(',') + ') VALUES( ' + temp.join(',') + ' ) RETURNING *', values)
	.then(formatResponse);
};

DB.update = function(data, cond) {

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
	return this.query('UPDATE ' + this.table + ' SET ' + set.join(',') + ' WHERE ' + where.join(' AND '), values)
	.then((resp) => {
		if (resp.rowCount) {
			resp.success = true;
		}
		else {
			resp.error = true;
			resp.details = 'Did not update any results';
		}
		return resp;
	});
};


DB.delete = function(cond) {

	var values = [],
		where = [],
		i = 1;

	for (let x in cond) {
		where.push(x + ' = $' + i++);
		values.push(cond[x]);
	}

	return this.query('DELETE FROM ' + this.table + ' WHERE ' + where.join(' AND '), values)
	.then(formatResponse);
};

function formatResponse(res) {
	// If the response contains a single row, return that row
	return res.rows && res.rows.length ? res.rows[0] : res;
}
