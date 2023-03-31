import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { GuildMember } from "discord.js"
import clearQueue from "../../../functions/commandUtils/clearqueue"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const { user } = req.body
		if (!user) return res.status(400).json({ error: "Missing username" })

		const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
		const member = guild?.members.cache.find(m => m.user.username === user) as GuildMember

		const response = await clearQueue(client, { member })
		if (response.error) return res.status(400).json({ error: response.error })
		return res.status(response.status).json({ message: response.message })
	})
}
