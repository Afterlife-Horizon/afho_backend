const _ = require('lodash');
const dbConnection = require("./connection");

const updateDB = (database, query, args, callback) => {
    dbConnection(database).getConnection((connErr, connection) => {
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

const selectFromDB = (database, query, args, callback) => {
    dbConnection(database).getConnection((connErr, connection) => {
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

module.exports = db => {
    db.updateDB = _.curry(updateDB)(db.database);
    db.selectFromDB = _.curry(selectFromDB)(db.database);
};