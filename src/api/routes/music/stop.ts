import express = require("express")
import BotClient from "../../../botClient/BotClient"
import musicStop from "../../../functions/commandUtils/music/musicStop"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		if (!req.body.user) return res.status(400).json({ error: "No user provided!" })

		const result = musicStop(client, req.body.user)

		if (result.status === 200) return res.status(200).json({ message: result.message ? result.message : "👍" })
		return res.status(result.status).json({ error: result.error ? result.error : "👎" })
	})
}
