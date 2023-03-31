import express = require("express")
const router = express.Router()

function compareData(count1, count2) {
	if (count1.xp > count2.xp) return -1
	else if (count1.xp < count2.xp) return 1
	return 0
}

import getLevelFromXp from "../../functions/getLevelFromXp"
import BotClient from "../../botClient/BotClient"
import { Level } from "../../types"

export default function levels(client: BotClient) {
	return router.get("/", async (_, res) => {
		try {
			const ids: string[] = []
			const levelarray: Level[] = []
			client.dbClient.selectFromDB("SELECT * FROM bot_levels", [], (err, rows) => {
				if (err) {
					console.error(err)
				} else if (rows.length > 0) {
					rows.forEach(row => {
						ids.push(row.id)
						levelarray.push({
							id: row.id,
							xp: row.xp,
							lvl: getLevelFromXp(row.xp)
						})
					})
				}
			})

			const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
			if (!guild) {
				res.status(500).json({ error: "Internal error" })
				return
			}

			await guild.members.fetch()
			const members = guild.members.cache.filter(m => ids.includes(m.id))

			const sendData = members.map(m => {
				const level = levelarray.find(move => move.id === m.id)
				if (!level) return { user: m, xp: 0, lvl: 0 }
				return { user: m, xp: level.xp, lvl: level.lvl }
			})

			res.json(sendData.sort(compareData))
		} catch (err) {
			console.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
