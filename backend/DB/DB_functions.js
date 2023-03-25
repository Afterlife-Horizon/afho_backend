const _ = require('lodash');
const dbConnection = require("./connection");

const updateDB = (database, query, args, callback) => {
    const conn = dbConnection(database);
    conn.getConnection((connErr, connection) => {
        if (connErr) {
            connection.release();
            return callback(connErr);
        }
        else {
            connection.query(query, args, (queryErr) => {
                if (queryErr) {
                    connection.release();
                    conn.end();
                    return callback(queryErr);
                }
                else {
                    connection.release();
                    conn.end();
                    return callback(null);
                }
            });
        }
    });
};

const selectFromDB = (database, query, args, callback) => {
    const conn = dbConnection(database);
    conn.getConnection((connErr, connection) => {
        if (connErr) {
            conn.end();
            return callback(connErr, []);
        }
        else {
            connection.query(query, args, (queryErr, rows) => {
                if (queryErr) {
                    connection.release();
                    conn.end();
                    return callback(queryErr, []);
                }
                else {
                    connection.release();
                    conn.end();
                    return callback(null, rows);
                }
            });
        }
    });
};

module.exports = {
    updateDB,
    selectFromDB,
}