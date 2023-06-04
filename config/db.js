const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'us-cdbr-east-06.cleardb.net',
    user: 'b50dc1dd046f11',
    password: '5f7a474b',
    database: 'heroku_3f76ca59525db1e'
});

module.exports = db;