import { Logger } from "../../logger/Logger"
import handleGPTChat from "../../functions/handleGPTChat"
import BotClient from "../BotClient"
import { handleAchievements } from "../../functions/handleAchievements"
import { AchievementType } from "../../types/achievementsEnums"

require("dotenv").config()

export default function (client: BotClient) {
	return client.on("messageCreate", async message => {
		if (message.author.bot) return

		client.prisma.levels
			.upsert({
				where: {
					user_id: message.author.id
				},
				update: {
					xp: {
						increment: 1
					}
				},
				create: {
					user_id: message.author.id,
					xp: 1
				},
				select: {
					xp: true
				}
			})
			.then(res => {
				const messageCount = res.xp
				handleAchievements(client, AchievementType.MESSAGE, message.author.id, messageCount)
			})
			.catch(Logger.error)

		handleGPTChat(client, message)
	})
}
