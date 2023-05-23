import express = require("express")
import BotClient from "../../botClient/BotClient"
const router = express.Router()

export default function (client: BotClient) {
	return router.get("/", (_req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		res.status(200).json(client.connectedMembers)
	})
}
