import BotClient from "../../botClient/BotClient"
import express = require("express")
import { Logger } from "../../logger/Logger"
const router = express.Router()

export default function (client: BotClient) {
	return router.get("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

			const guild = await client.guilds.fetch(client.config.serverID)
			if (!guild) return res.status(500).json({ error: "Internal error" })
			await guild.members.fetch()

			const rows = await client.prisma.bot_time.findMany({
				orderBy: {
					time_spent: "desc"
				}
			})

			const sendData = rows.map(row => {
				const member = guild.members.cache.find(mem => mem.user.id === row.user_id)
				return {
					user: member,
					time_spent: row.time_spent
				}
			})

			res.status(200).json(sendData)
		} catch (err) {
			Logger.error(JSON.stringify(err))
			res.status(500).json({ error: "Internal error" })
		}
	})
}
