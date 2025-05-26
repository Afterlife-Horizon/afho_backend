import BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"
import { exit } from "process"

export default function initStopListeners(client: BotClient) {
    process.on("SIGTERM", async () => {
        Logger.log("Gracefully shutting down!")
        await client.stop()
        exit(0)
    })

    process.on("SIGINT", async () => {
        Logger.log("Gracefully shutting down!")
        await client.stop()
        exit(0)
    })
}
