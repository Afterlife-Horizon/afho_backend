import express = require("express")
import BotClient from "../../../botClient/BotClient"
import pause from "../../../functions/commandUtils/music/pause"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const response = pause(client, req.body.user)

		if (response.status === 200) return res.status(200).json({ message: response.message })
		return res.status(406).json({ error: response.error })
	})
}
