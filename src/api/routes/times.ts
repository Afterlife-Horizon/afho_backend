import express = require("express")
const router = express.Router()
import type BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"

export default function (client: BotClient) {
    return router.get("/", async (_, res) => {
        try {
            if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

            const sendData = Array.from(client.cacheHandler.timeValues.values()).sort((time1, time2) => {
                if (time1.time_spent > time2.time_spent) return -1
                if (time1.time_spent < time2.time_spent) return 1
                return 0
            })

            res.status(200).json(sendData)
        } catch (err) {
            Logger.error(err)
            res.status(500).json({ error: "Internal error" })
        }
    })
}
