import express = require("express")
import { Logger } from "../../../logger/Logger"
const router = express.Router()
import type BotClient from "../../../botClient/BotClient"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			if (!req.body) return res.status(406).send({ error: "No Body!" })

			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const favorites = client.favs.get(member.id) || []
			const sorted = favorites.sort((a, b) => b.date_added.getTime() - a.date_added.getTime())

			res.status(200).json({ favorites: sorted })
		} catch (err) {
			Logger.error(err)
			res.status(500).send("Internal Server Error")
		}
	})
}
