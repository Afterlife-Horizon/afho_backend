import express = require("express")
import BotClient from "../../../botClient/BotClient"
import shuffle from "../../../functions/commandUtils/music/shuffle"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const response = shuffle(client, req.body.user)

		if (response.error) return res.status(response.status).json({ error: response.error })
		return res.status(response.status).json({ message: response.message ? response.message : "👍" })
	})
}
