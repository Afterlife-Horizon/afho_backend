const mysql = require("mysql");
const connection = (database) => {
    const host = process.env.DB_ADRESS || "127.0.0.1";
    const user = process.env.DB_USER || "";
    const password = process.env.DB_PASSWORD || "";

    try {
        return mysql.createPool({
            host: host,
            user: user,
            password: password,
            database: database,
        });
    }
    catch (error) {
        console.error(error);
    }
};
module.exports = database => {
    connection(database);
};