import BotClient from "../botClient/BotClient"
import { Logger } from "../logger/Logger"
import { AchievementType } from "../types/achievementsEnums"

export async function handleAchievements(client: BotClient, type: AchievementType, id: string, info: unknown) {
	if (type === AchievementType.MESSAGE) return handleMessageAchievements(client, id, info as number)
	if (type === AchievementType.TIME) return handleTimeAchievements(client, id, info as number)
	if (type === AchievementType.BrasilRecieved) return handleBrasilRecievedAchievements(client, id, info as number)
	if (type === AchievementType.BrasilSent) return handleBrasilSentAchievements(client, id, info as number)
}

async function handleMessageAchievements(client: BotClient, id: string, messageCount: unknown) {
	if (typeof messageCount !== "number") return Logger.error("handleMessageAchievements: messageCount is not a number")

	if (messageCount > 10000) {
		return
	}

	if (messageCount > 5000) {
		return
	}

	if (messageCount > 2000) {
		return
	}

	if (messageCount > 1000) {
	}
}

async function handleTimeAchievements(client: BotClient, id: string, time: unknown) {
	if (typeof time !== "number") return Logger.error("handleTimeAchievements: time is not a number")

	if (time > 10000) {
		return
	}

	if (time > 5000) {
		return
	}

	if (time > 2000) {
		return
	}

	if (time > 1000) {
	}
}

async function handleBrasilRecievedAchievements(client: BotClient, id: string, brasilRecieved: unknown) {
	if (typeof brasilRecieved !== "number") return Logger.error("handleBrasilRecievedAchievements: brasilRecieved is not a number")

	if (brasilRecieved > 10000) {
		return
	}

	if (brasilRecieved > 5000) {
		return
	}

	if (brasilRecieved > 2000) {
		return
	}

	if (brasilRecieved > 1000) {
	}
}

async function handleBrasilSentAchievements(client: BotClient, id: string, brasilSent: unknown) {
	if (typeof brasilSent !== "number") return Logger.error("handleBrasilSentAchievements: brasilSent is not a number")

	if (brasilSent > 10000) {
		return
	}

	if (brasilSent > 5000) {
		return
	}

	if (brasilSent > 2000) {
		return
	}

	if (brasilSent > 1000) {
	}
}
