import express = require("express")
import BotClient from "../../../botClient/BotClient"
import disconnect from "../../../functions/commandUtils/music/disconnect"

const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		if (!client.currentChannel) return res.status(406).send("not connected!")

		const response = await disconnect(client)

		if (response.status === 200) {
			res.status(200).json({ message: response.message })
		}
		res.status(response.status).json({ error: response.error })
	})
}
