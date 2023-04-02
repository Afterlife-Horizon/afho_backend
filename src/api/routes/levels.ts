import express = require("express")
import getLevelFromXp from "../../functions/getLevelFromXp"
import BotClient from "../../botClient/BotClient"
import { PrismaClient } from "@prisma/client"

function compareData(count1, count2) {
	if (count1.xp > count2.xp) return -1
	else if (count1.xp < count2.xp) return 1
	return 0
}

const router = express.Router()
const prisma = new PrismaClient()

export default function levels(client: BotClient) {
	return router.get("/", async (_, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const rows = await prisma.bot_levels.findMany()

			const guild = client.guilds.cache.get(client.config.serverId)
			if (!guild) return res.status(500).json({ error: "Internal error" })

			const sendData = rows.map(row => {
				const level = getLevelFromXp(row.xp)
				const member = guild.members.cache.find(mem => mem.user.id === row.id)
				return {
					user: member,
					xp: row.xp,
					lvl: level
				}
			})

			res.json(sendData.sort(compareData))
		} catch (err) {
			console.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
