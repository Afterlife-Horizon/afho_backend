import BotClient from "../botClient/BotClient"
import { Logger } from "../logger/Logger"
import {
	Achievement,
	AchievementTitle,
	AchievementType,
	BrasilRecievedAchievementTitle,
	BrasilSentAchievementTitle,
	MessageAchievementTitle,
	TimeAchievementTitle
} from "../types/achievements"

export async function handleAchievements(client: BotClient, type: AchievementType, id: string, info: unknown) {
	if (type === AchievementType.MESSAGE) return handleMessageAchievements(client, id, info)
	if (type === AchievementType.TIME) return handleTimeAchievements(client, id, info)
	if (type === AchievementType.BrasilRecieved) return handleBrasilRecievedAchievements(client, id, info)
	if (type === AchievementType.BrasilSent) return handleBrasilSentAchievements(client, id, info)
}

async function handleMessageAchievements(client: BotClient, id: string, messageCount: unknown) {
	if (typeof messageCount !== "number") return Logger.error("handleMessageAchievements: messageCount is not a number")

	const previousAchievement = client.achievements.get(id)?.find(achievement => achievement.type === AchievementType.MESSAGE)
	const user = client.guilds?.cache.get(client.config.serverID)?.members.cache.get(id)
	if (!user) return Logger.error("handleMessageAchievements: user not found")

	let enumValue: AchievementTitle | null = null
	if (messageCount >= 10000) enumValue = MessageAchievementTitle.FOURTH
	else if (messageCount >= 5000) enumValue = MessageAchievementTitle.THIRD
	else if (messageCount >= 2000) enumValue = MessageAchievementTitle.SECOND
	else if (messageCount >= 1000) enumValue = MessageAchievementTitle.FIRST

	if (!enumValue || enumValue === previousAchievement?.currentTitle) return


	const achievement: Achievement = {
		user,
		currentTitle: enumValue,
		type: AchievementType.MESSAGE
	}
	await applyAchievment(client, achievement, previousAchievement)
}

async function handleTimeAchievements(client: BotClient, id: string, time: unknown) {
	if (typeof time !== "number") return Logger.error("handleTimeAchievements: time is not a number")

	const previousAchievement = client.achievements.get(id)?.find(achievement => achievement.type === AchievementType.TIME)
	const user = client.guilds?.cache.get(client.config.serverID)?.members.cache.get(id)
	if (!user) return Logger.error("handleMessageAchievements: user not found")

	let enumValue: AchievementTitle | null = null
	if (time > 3600000) enumValue = TimeAchievementTitle.SIXTH
	else if (time >= 1800000) enumValue = TimeAchievementTitle.FIFTH
	else if (time >= 720000) enumValue = TimeAchievementTitle.FOURTH
	else if (time >= 360000) enumValue = TimeAchievementTitle.THIRD
	else if (time >= 126000) enumValue = TimeAchievementTitle.SECOND
	else if (time >= 86400) enumValue = TimeAchievementTitle.FIRST

	if (!enumValue || enumValue === previousAchievement?.currentTitle) return

	const achievement: Achievement = {
		user,
		currentTitle: enumValue,
		type: AchievementType.TIME
	}
	await applyAchievment(client, achievement, previousAchievement)
}

async function handleBrasilRecievedAchievements(client: BotClient, id: string, brasilRecieved: unknown) {
	if (typeof brasilRecieved !== "number") return Logger.error("handleBrasilRecievedAchievements: brasilRecieved is not a number")

	const previousAchievement = client.achievements.get(id)?.find(achievement => achievement.type === AchievementType.BrasilRecieved)
	const user = client.guilds?.cache.get(client.config.serverID)?.members.cache.get(id)
	if (!user) return Logger.error("handleMessageAchievements: user not found")

	let enumValue: AchievementTitle | null = null
	if (brasilRecieved >= 200) enumValue = BrasilRecievedAchievementTitle.FIFTH
	else if (brasilRecieved >= 100) enumValue = BrasilRecievedAchievementTitle.FOURTH
	else if (brasilRecieved >= 50) enumValue = BrasilRecievedAchievementTitle.THIRD
	else if (brasilRecieved >= 25) enumValue = BrasilRecievedAchievementTitle.SECOND
	else if (brasilRecieved >= 1) enumValue = BrasilRecievedAchievementTitle.FIRST

	if (!enumValue || enumValue === previousAchievement?.currentTitle) return

	const achievement: Achievement = {
		user,
		currentTitle: enumValue,
		type: AchievementType.BrasilRecieved
	}
	await applyAchievment(client, achievement, previousAchievement)
}

async function handleBrasilSentAchievements(client: BotClient, id: string, brasilSent: unknown) {
	if (typeof brasilSent !== "number") return Logger.error("handleBrasilSentAchievements: brasilSent is not a number")

	const previousAchievement = client.achievements.get(id)?.find(achievement => achievement.type === AchievementType.BrasilSent)
	const user = client.guilds?.cache.get(client.config.serverID)?.members.cache.get(id)
	if (!user) return Logger.error("handleMessageAchievements: user not found")

	let enumValue: AchievementTitle | null = null
	if (brasilSent >= 200) enumValue = BrasilSentAchievementTitle.FIFTH
	else if (brasilSent >= 100) enumValue = BrasilSentAchievementTitle.FOURTH
	else if (brasilSent >= 50) enumValue = BrasilSentAchievementTitle.THIRD
	else if (brasilSent >= 25) enumValue = BrasilSentAchievementTitle.SECOND
	else if (brasilSent >= 1) enumValue = BrasilSentAchievementTitle.FIRST

	if (!enumValue || enumValue === previousAchievement?.currentTitle) return

	const achievement: Achievement = {
		user,
		currentTitle: enumValue,
		type: AchievementType.BrasilSent
	}
	await applyAchievment(client, achievement, previousAchievement)
}

async function applyAchievment(client: BotClient, achievement: Achievement, previousAchievement: Achievement | undefined) {
	const previousAchievements = client.achievements.get(achievement.user.id) || []
	client.achievements.set(achievement.user.id, [...previousAchievements, achievement])
	try {
		if (!!previousAchievement)
			return await client.prisma.achievement_get.update({
				where: {
					user_id_type: {
						user_id: achievement.user.id,
						type: achievement.type
					}
				},
				data: {
					achievement_name: achievement.currentTitle
				}
			})

		await client.prisma.achievement_get.create({
			data: {
				achievement_name: achievement.currentTitle,
				user_id: achievement.user.id,
				type: achievement.type
			}
		})
	} catch (error: any) {
		if (error.code === "P2002") return
		Logger.error(error)
	}
}
