const db = require("./connection");

const updateDB = (query, args, callback) => {
    db.connection.getConnection((connErr, connection) => {
        if (connErr) {
            connection.release();
            return callback(connErr);
        }
        else {
            connection.query(query, args, (queryErr) => {
                if (queryErr) {
                    connection.release();
                    return callback(queryErr);
                }
                else {
                    connection.release();
                    return callback(null);
                }
            });
        }
    });
};

const selectFromDB = (query, args, callback) => {
    db.connection.getConnection((connErr, connection) => {
        if (connErr) {
            return callback(connErr, []);
        }
        else {
            connection.query(query, args, (queryErr, rows) => {
                if (queryErr) {
                    connection.release();
                    return callback(queryErr, []);
                }
                else {
                    connection.release();
                    return callback(null, rows);
                }
            });
        }
    });
};

module.exports = { updateDB, selectFromDB };