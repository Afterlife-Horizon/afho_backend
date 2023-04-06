import log4js from "log4js"

export class Logger {
	private static logger: log4js.Logger
	private static gptLogger: log4js.Logger

	public static init() {
		log4js.configure({
			appenders: {
				out: { type: "stdout" },
				app: { type: "file", filename: "logs/app.log" },
				error: { type: "file", filename: "logs/error.log" },
				gpt: { type: "file", filename: "logs/gpt.log" }
			},
			categories: {
				default: {
					appenders: ["out", "error"],
					level: "ERROR"
				},
				info: {
					appenders: ["out", "app"],
					level: "INFO"
				},
				debug: {
					appenders: ["out", "app", "error"],
					level: "DEBUG"
				},
				gpt: {
					appenders: ["gpt"],
					level: "INFO"
				}
			}
		})
		this.logger = log4js.getLogger(process.env.LOG_LEVEL || "info")
		this.gptLogger = log4js.getLogger("gpt")
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
