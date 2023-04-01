import express = require("express")
const router = express.Router()
import BotClient from "../../../botClient/BotClient"
import play from "../../../functions/commandUtils/music/play"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

		const response = await play(client, req.body.user, req.body.songs)

		if (response.status === 200) return res.status(200).json({ message: response.message })
		return res.status(406).json({ error: response.error })
	})
}
