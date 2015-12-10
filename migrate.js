#! /usr/bin/node
'use strict';
var debug = require('debug')('migrate');

// Migration script
// Create a user table

// Loop through the existing users
var db = require('./src/db');

db.query('SELECT * FROM apps ORDER BY LENGTH(admin_id) DESC', [], (err, resp) => {

	// How many apps are there
	debug('Found %d', resp.rows.length);

	// Loop through each application and retrieve the credentials
	walk(resp.rows, 0, (item, next) => {

		// An object carrying the values of all the ID's of a user
		let ids = {};

		// Convert the ids into a condition
		var condition = [];

		// Extract the credentials
		item.admin_id.split(/[\s,]/).forEach((admin_id) => {
			let m = admin_id.split('@');
			let id = m[0];
			let network = m[1] + '_id';

			// Does this network already have a value?
			if (!(network in ids)) {
				ids[network] = [];
				ids[network].push(id);
			}
			else if (ids[network].indexOf(id) === -1) {
				ids[network].push(id);
				debug('Duplicate network values %s', ids[network].join(' '));
			}

			condition.push(network + ' ~* \'\\y' + id + '\\y\'');
		});

		let sql = 'SELECT * FROM users WHERE ' + condition.join(' OR ');
		debug(sql);

		// Identify the user from the user table
		db.query(sql, [], (err, resp) => {

			if (err) {
				debug(err);
				return;
			}

			let sql = '';
			let arr = [];

			if (resp.rows.length > 1) {
				debug('Crap this matches two records, this is bad.');
				return;
			}
			// If such an entry is found
			else if (resp.rows.length === 1) {

				let stored = resp.rows[0];
				let upd = [];

				// Are there new fields to add to this?
				for (let x in ids) {
					if (stored[x]) {
						ids[x] = ids[x].concat(stored[x].split(',')).filter(unique);
					}
					ids[x] = ids[x].join(',');
					upd.push(x + ' = \'' + ids[x] + '\'');
				}
				sql = 'UPDATE users SET ' + upd.join(',') + ' WHERE id = $1 RETURNING id AS id';
				arr.push(stored.id);
			}
			else {
				// create a new instance
				let values = [];
				for (let x in ids) {
					ids[x] = ids[x].join(',');
					values.push(ids[x]);
				}

				let keys = Object.keys(ids);
				sql = 'INSERT INTO users (' + keys.join(',') + ') VALUES (\'' + values.join('\', \'') + '\') RETURNING id AS id';
			}

			debug(sql, arr);
			db.query(sql, arr, (err, resp) => {
				if (err) {
					debug(err);
				}
				else {
					// Update this record with the new primary key of the user
					db.query('UPDATE apps SET user_id = $1 WHERE guid = $2', [resp.rows[0].id, item.guid], next);
				}
			});
		});

	});
});


function walk(arr, start, callback) {
	callback(arr[start], () => {
		// increment start position
		start++;

		if (arr.length > start) {
			walk(arr, start, callback);
		}
	})
}

function unique(element, index, array) {
	return array.indexOf(element) === index;
}
