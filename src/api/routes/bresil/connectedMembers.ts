import express = require("express")
import type BotClient from "#/botClient/BotClient"
const router = express.Router()

export default function (client: BotClient) {
    return router.get("/", async (req, res) => {
        if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        res.json({ data: client.cacheHandler.connectedMembers })
    })
}
