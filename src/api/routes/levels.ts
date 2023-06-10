import express = require("express")
import { Logger } from "../../logger/Logger"
import type BotClient from "../../botClient/BotClient"
import { Xp } from "types"

function compareData(count1: Xp, count2: Xp) {
	if (count1.xp > count2.xp) return -1
	else if (count1.xp < count2.xp) return 1
	return 0
}

const router = express.Router()

export default function levels(client: BotClient) {
	return router.get("/", async (_, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const sendData = Array.from(client.xps.values()).sort(compareData)
			res.json(sendData)
		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
