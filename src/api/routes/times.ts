import express = require("express")
const router = express.Router()
import { Logger } from "../../logger/Logger"
import type BotClient from "../../botClient/BotClient"

export default function (client: BotClient) {
	return router.get("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

			const sendData = Array.from(client.timeValues.values()).sort((a, b) => {
				if (a.time_spent > b.time_spent) return -1
				else if (a.time_spent < b.time_spent) return 1
				return 0
			})
			res.status(200).json(sendData)
		} catch (err) {
			Logger.error(JSON.stringify(err))
			res.status(500).json({ error: "Internal error" })
		}
	})
}
