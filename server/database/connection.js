const mysql = require('mysql2'); //mysql
const config = require('./config.js');
const connection = mysql.createConnection(config);

module.exports = connection;