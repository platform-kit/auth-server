
var pg = require('pg');
var conn = process.env.HEROKU_POSTGRESQL_BLUE_URL||"tcp://postgres:root@localhost/postgres";
var client = new pg.Client(conn);
client.connect();
console.log("Connected to POSTGRESQL " + conn);


module.exports = new (function(){

	// Extend the default database
	this.query = function(){
		client.query.apply(client, arguments);
	};

	// default table
	this.table = '';

	this.insert = function(data,callback){

		var keys = [], 
			values = [], 
			temp = [],
			i=1;

		for(var x in data){
			keys.push(x);
			temp.push('$'+ i++);
			values.push(data[x]);
		}
		var sql = 'INSERT INTO '+ this.table + '('+ keys.join(',') +') VALUES( ' + temp.join(',') + ' ) RETURNING *';
		console.log(sql);
		this.query(sql, values, function(err,result){
			callback(err,result);
		});
	};

	this.update = function(data,cond,callback){

		var set = [], 
			values = [], 
			where = [],
			i=1;

		for(var x in data){
			set.push(x + " = $" + i++);
			values.push(data[x]);
		}
		for(var x in cond){
			where.push(x + " = $" + i++);
			values.push(cond[x]);
		}
		var sql = 'UPDATE '+ this.table + ' SET '+ set.join(',') +' WHERE ' + where.join(' AND ');
		console.log(sql);
		this.query(sql, values, function(err,result){
			callback(err,result);
		});
	};

	this.delete = function(cond, callback){

		var values = [], 
			where = [],
			i=1;

		for(var x in cond){
			where.push(x + " = $" + i++);
			values.push(cond[x]);
		}

		var sql = 'DELETE FROM '+ this.table + ' WHERE ' + where.join(' AND ');
		console.log(sql);
		this.query(sql, values, function(err,result){
			callback(err,result);
		});
	};

})();