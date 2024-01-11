import log4js from "log4js"

export class Logger {
    private static logger: log4js.Logger
    private static gptLogger: log4js.Logger

    public static init() {
        log4js.configure({
            appenders: {
                out: { type: "stdout", layout: { type: "colored" } },
                app: { type: "file", filename: "logs/app.log" },
                error: { type: "file", filename: "logs/error.log" },
                gpt: { type: "file", filename: "logs/gpt.log" },
                multi: {
                    type: "multiFile",
                    base: "logs/",
                    property: "categoryName",
                    extension: ".log",
                    layout: {
                        type: "pattern",
                        pattern: "[%d{yyyy-MM-dd hh:mm:ss}] [%p] %m",
                        colours: {
                            trace: "blue",
                            debug: "blue",
                            info: "green",
                            warn: "yellow",
                            error: "red",
                            fatal: "red"
                        }
                    }
                }
            },
            categories: {
                default: {
                    appenders: ["out", "multi"],
                    level: "ERROR",
                    enableCallStack: true
                },
                info: {
                    appenders: ["out", "multi"],
                    level: "INFO"
                },
                debug: {
                    appenders: ["out", "app", "multi"],
                    level: "DEBUG",
                    enableCallStack: true
                },
                gpt: {
                    appenders: ["gpt"],
                    level: "INFO"
                }
            }
        })
        this.logger = log4js.getLogger(process.env.LOG_LEVEL || "info")
        this.gptLogger = log4js.getLogger("gpt")

        this.log("Logger initialized")
        if (process.env.LOG_LEVEL) this.log(`Log level: ${process.env.LOG_LEVEL}`)
    }

    public static logGPT(message: string) {
        this.gptLogger.info(message)
    }

    public static log(message: any) {
        this.logger.info(message)
    }

    public static error(error: any) {
        this.logger.error(error)
    }

    public static debug(message: any) {
        this.logger.debug(message)
    }

    public static warn(message: any) {
        this.logger.warn(message)
    }

    public static fatal(error: any) {
        this.logger.fatal(error)
    }

    public static trace(trace: any) {
        this.logger.trace(trace)
    }
}
