import express = require("express")
const router = express.Router()
import BotClient from "../../../botClient/BotClient"
import play from "../../../functions/commandUtils/music/play"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
			if (!req.body.songs) return res.status(406).json({ error: "No songs provided!" })

			const access_token = req.body.access_token

			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)

			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const response = await play(client, user.data.user?.user_metadata.full_name, req.body.songs)

			if (response.status === 200) return res.status(200).json({ message: response.message })
			return res.status(406).json({ error: response.error })
		} catch (err) {
			if (err instanceof Error) Logger.error(err.message)
			return res.status(500).json({ error: err })
		}
	})
}
