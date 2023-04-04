import log4js from 'log4js';

export class Logger {
    private static logger: log4js.Logger;

    public static init() {
        log4js.configure({
            appenders: {
                out: { type: 'stdout' },
                app: { type: 'file', filename: 'logs/app.log' },
                error: { type: 'file', filename: 'logs/error.log'}
            },
            categories: {
                default: {
                    appenders: ['out', 'error'],
                    level: 'error'
                },
                info: {
                    appenders: ['out', 'app'],
                    level: 'info'
                },
                debug: { 
                    appenders: ['out', 'app', 'error'], 
                    level: 'debug' 
                },
            },
        });
        this.logger = log4js.getLogger(process.env.LOG_LEVEL || "info");
    }

    public static log(message: string) {
        this.logger.info(message);
    }

    public static error(message: string) {
        this.logger.error(message);
    }

    public static debug(message: string) {
        this.logger.debug(message);
    }

    public static warn(message: string) {
        this.logger.warn(message);
    }

    public static fatal(message: string) {
        this.logger.fatal(message);
    }

    public static trace(message: string) {
        this.logger.trace(message);
    }

}