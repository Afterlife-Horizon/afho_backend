import express = require("express")
import { Logger } from "../../logger/Logger"
import type BotClient from "../../botClient/BotClient"

const router = express.Router()

export default function achievements(client: BotClient) {
	return router.get("/", async (_, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            const achievements = Array.from(client.achievements.values()).map(a => a.at(0))
			res.json(achievements)
		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
