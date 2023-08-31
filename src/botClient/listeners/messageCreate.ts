import { Logger } from "../../logger/Logger"
import handleGPTChat from "../../functions/handleGPTChat"
import BotClient from "../BotClient"
import { handleAchievements } from "../../functions/handleAchievements"
import { AchievementType } from "../../types/achievements"
import { playSound } from "../../functions/playSound"

require("dotenv").config()

export default function (client: BotClient) {
	return client.on("messageCreate", async message => {
		if (message.author.bot) return

		const member = message.member
		if (!member) return
		await client.updateDBUser(member)

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
			.then(async res => {
				const messageCount = res.xp
				await handleAchievements(client, AchievementType.MESSAGE, message.author.id, messageCount)
			})
			.catch(Logger.error)

		if (client.config.funnySound && !message.content.includes("http")) {
			if (message.content.toLowerCase().includes("quoi")) playSound(client, message, "quoicoube")
			if (message.content.toLowerCase().includes("yo")) playSound(client, message, "yoooooo")
			if (message.content.toLowerCase().includes("juif")) playSound(client, message, "raciste")
			if (message.content.toLowerCase().includes("noir")) playSound(client, message, "raciste")
			if (message.content.toLowerCase().includes("asia")) playSound(client, message, "raciste")
			if (message.content.toLowerCase().includes("racisme")) playSound(client, message, "raciste")
			if (message.content.toLowerCase().includes("raciste")) playSound(client, message, "raciste")
			if (message.content.toLowerCase().includes("based")) playSound(client, message, "based_bocchi")
			if (message.content.toLowerCase().includes("omg")) playSound(client, message, "hello")
			if (message.content.toLowerCase().includes("hello")) playSound(client, message, "hello")
			if (message.content.toLowerCase().includes("hallo")) playSound(client, message, "hello")
			if (message.content.toLowerCase().includes("gay")) playSound(client, message, "bander")
			if (message.content.toLowerCase().includes("baise")) playSound(client, message, "bander")
			if (message.content.toLowerCase().includes("nik")) playSound(client, message, "bander")
			if (message.content.toLowerCase().includes("nique")) playSound(client, message, "bander")
			if (message.content.toLowerCase().includes("pute")) playSound(client, message, "bander")
			if (message.content.toLowerCase().includes("prime")) playSound(client, message, "optimum_prime")
		}

		handleGPTChat(client, message)
	})
}