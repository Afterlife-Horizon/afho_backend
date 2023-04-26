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

	public static log(message: string) {
		this.logger.info(message)
	}

	public static error(message: string) {
		this.logger.error(message)
	}

	public static debug(message: string) {
		this.logger.debug(message)
	}

	public static warn(message: string) {
		this.logger.warn(message)
	}

	public static fatal(message: string) {
		this.logger.fatal(message)
	}

	public static trace(message: string) {
		this.logger.trace(message)
	}
}
