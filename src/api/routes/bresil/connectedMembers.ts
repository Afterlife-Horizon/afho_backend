import express = require("express")
import BotClient from "../../../botClient/BotClient"
const router = express.Router()

export default function (client: BotClient) {
	return router.get("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			await client.guilds.fetch()
			const guild = await client.guilds.fetch(client.config.serverID)

			if (!guild) return res.status(404).json({ error: "Guild not found" })

			const connectedMembers = await guild.members.fetch().then(m => m.filter(m => m.voice.channel).map(m => m.user))

			res.json({ data: connectedMembers })
		} catch (err) {
			console.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
