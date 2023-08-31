import express = require("express")
import { Logger } from "../../logger/Logger"
import type BotClient from "../../botClient/BotClient"

const router = express.Router()

export default function achievements(client: BotClient) {
	return router.get("/", async (_, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            const users = client.users.cache
			const achievements = await client.prisma.achievements.findMany()
			const achievement_get = await client.prisma.achievement_get.findMany()

			const data = users.map(user => {
				const userAchievementGet = achievement_get.filter(achievement => achievement.user_id === user.id)
				const userAchievements = achievements.filter(achievement => userAchievementGet.map(a => a.achievement_name).includes(achievement.name))

				return {
					id: user.id,
					username: user.username,
					achievements: userAchievements
				}
			})

			res.status(200).json(data)
		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
