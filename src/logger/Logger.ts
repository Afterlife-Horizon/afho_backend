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
        Logger.logger = log4js.getLogger(process.env.LOG_LEVEL || "info");
    }

    public static log(message: string) {
        Logger.logger.info(message);
    }

    public static error(message: string) {
        Logger.logger.error(message);
    }

    public static debug(message: string) {
        Logger.logger.debug(message);
    }

    public static warn(message: string) {
        Logger.logger.warn(message);
    }

    public static fatal(message: string) {
        Logger.logger.fatal(message);
    }

    public static trace(message: string) {
        Logger.logger.trace(message);
    }

}