import express = require("express")
import type BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"

const router = express.Router()

export default function getUser(client: BotClient) {
    return router.post("/", async (req, res) => {
        if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            if (!req.body.id) return res.status(400).json({ error: "Missing id" })
            const sendData = await client.prisma.users.findUnique({
                where: {
                    id: req.body.id
                }
            })
            res.json(sendData)
        } catch (err) {
            Logger.error(err)
            res.status(500).json({ error: "Internal error" })
        }
    })
}
