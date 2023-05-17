import express = require("express")
const router = express.Router()
import clearQueue from "../../../functions/commandUtils/music/clearqueue"
import { Logger } from "../../../logger/Logger"
import type BotClient from "../../../botClient/BotClient"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const admins = guild.roles.cache.get(client.config.adminRoleID)?.members
			if (!admins) return res.status(406).send("Admins not found!")
			if (!admins.has(user.data?.user?.user_metadata.provider_id)) return res.status(406).send("You are not an admin!")

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const response = await clearQueue(client, { member })
			if (response.error) return res.status(400).json({ error: response.error })
			return res.status(response.status).json({ message: response.message })
		} catch (err) {
			Logger.error(JSON.stringify(err))
			return res.status(500).json({ error: err })
		}
	})
}
