import myslqi from 'mysql';

export default class DBClient {
    private connection: myslqi.Pool;
    constructor() {
        this.connection = this.getConnection();
    }

    private getConnection () {
        const host = process.env.DB_ADRESS || "127.0.0.1";
        const user = process.env.DB_USER || "root";
        const password = process.env.DB_PASSWORD || "root";
        const database = process.env.DB_DATABASE || "AFHO";
    
        const conn = myslqi.createPool({
            host: host,
            user: user,
            password: password,
            database: database,
        });
    
        return conn;
    }

    /**
     * executes a sql query on the database to update it (INSERT, UPDATE, DELETE)
     * @param query sql query to execute
     * @param args arguments for the query
     * @param callback callback function
     */
    public updateDB (query : string, args : any[], callback : (err : Error | null) => void) {
        this.connection.getConnection((connErr, connection) => {
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
    }

    /**
     * executes a sql query on the database to select from it (SELECT)
     * @param query sql query to execute
     * @param args arguments for the query
     * @param callback callback function
     */
    public selectFromDB (query: string, args: string[], callback: (err: Error | null, rows: any[]) => void) {
        this.connection.getConnection((connErr, connection) => {
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
    }
}