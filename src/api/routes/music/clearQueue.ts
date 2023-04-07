import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { GuildMember } from "discord.js"
import clearQueue from "../../../functions/commandUtils/music/clearqueue"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const access_token = req.body.access_token
		if (!access_token) return res.status(406).send({ error: "No Access Token!" })

		const user = await client.supabaseClient.auth.getUser(access_token)
		if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

		const guild = await client.guilds.fetch(client.config.serverID)
		if (!guild) return res.status(406).send({ error: "Server not found!" })

		const admins = (await guild.roles.fetch(client.config.adminRoleID))?.members

		if (!admins) return res.status(406).send("Admins not found!")

		if (!admins.has(user.data?.user?.user_metadata.provider_id)) return res.status(406).send("You are not an admin!")

		const member = await guild.members.fetch(user.data?.user?.user_metadata.provider_id)
		if (!member) return res.status(406).send({ error: "Member not found!" })

		const response = await clearQueue(client, { member })
		if (response.error) return res.status(400).json({ error: response.error })
		return res.status(response.status).json({ message: response.message })
	})
}
