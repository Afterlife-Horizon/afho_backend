const { host, user, password } = require('../config/DBConfig.json');

const mysql = require("mysql");
const connection = (database) => {
    return mysql.createPool({
        host: host,
        user: user,
        password: password,
        database: database,
    });
};
module.exports = database => {
    connection(database);
};