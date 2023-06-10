import express = require("express")
import type BotClient from "../../../botClient/BotClient"
import { PrismaClient } from "@prisma/client"
import { Logger } from "../../../logger/Logger"
const router = express.Router()

function compareData(count1, count2) {
	if (count1.bresil_received > count2.bresil_received) return -1
	else if (count1.bresil_received < count2.bresil_received) return 1
	return 0
}

const prisma = new PrismaClient()

export default function (client: BotClient) {
	return router.get("/", async (_, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const bresils = await prisma.bresil_count.findMany()

			const guild = await client.guilds.fetch(client.config.serverID)

			if (!guild) return res.status(406).json({ error: "Guild not found!" })

			await guild.members.fetch()

			const sendData = bresils.map(bresil => {
				const member = guild.members.cache.find(mem => mem.user.id === bresil.user_id)
				return {
					user: member,
					bresil_received: bresil.bresil_received,
					bresil_sent: bresil.bresil_sent
				}
			})

			res.json(sendData.sort(compareData))
		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
