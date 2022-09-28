const { host, user, password, database } = require('../config/DBConfig.json');

const mysql = require("mysql");
const connection = mysql.createPool({
    host: host,
    user: user,
    password: password,
    database: database,
});

module.exports = { connection };
