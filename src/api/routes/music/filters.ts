import express = require("express")
const router = express.Router()
import changeFilters from "../../../functions/commandUtils/music/filters"
import { Logger } from "../../../logger/Logger"
import type BotClient from "../../../botClient/BotClient"
import type { IFilters } from "../../../types/music"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send("Server not found!")

			const admins = guild.roles.cache.get(client.config.adminRoleID)?.members
			if (!admins) return res.status(406).send("Admins not found!")
			if (!admins.has(user.data?.user?.user_metadata.provider_id)) return res.status(406).send("You are not an admin!")

			const connectedMembers = guild.members.cache.filter(member => member.voice.channel)
			const requester = connectedMembers.find(member => member.user.username === user.data.user?.user_metadata.full_name)
			if (!requester) return res.status(406).send("User not found!")

			const filters = req.body.filters as IFilters
			if (!filters) return res.status(400).json({ error: "Missing filter" })

			const queue = client.queues.get(guild.id)
			if (!queue) return res.status(400).json({ error: "No queue found" })

			for (const [key, value] of Object.entries(filters)) {
				queue.effects[key] = value
			}

			client.queues.set(guild.id, queue)

			const response = await changeFilters(client, { member: requester })

			if (response.error) return res.status(400).json({ error: response.error })

			return res.status(response.status).json({ filters: client.queues.get(guild.id)?.effects })
		} catch (err) {
			Logger.error(err)
			return res.status(500).json({ error: err })
		}
	})
}
