import { GuildMember, VoiceChannel } from "discord.js"
import type BotClient from "../../../botClient/BotClient"
import { Logger } from "../../../logger/Logger"
import { isVoiceChannel } from "../../../functions/discordUtils"
import { handleAchievements } from "../../../functions/handleAchievements"
import { AchievementType } from "../../../types/achievements"

export default async function bresil(client: BotClient, mover: GuildMember, moved: GuildMember) {
	try {
		const guild = client.guilds.cache.get(client.config.serverID)
		if (!guild) return { status: 406, error: "Guild not found!" }

		const moverVoiceState = mover.voice
		const movedVoiceState = moved.voice

		if (!moverVoiceState) return { status: 406, error: "You are not in a channel!" }
		if (!movedVoiceState) return { status: 406, error: "The user you want to move is not in a channel!" }
		if (moverVoiceState.channel?.id !== movedVoiceState.channel?.id) return { status: 406, error: "You are not in the same channel!" }
		if (movedVoiceState.channel?.id === client.config.brasilChannelID)
			return { status: 406, error: "You cannot bresil someone already in bresil!" }
		if (moved.user.id === client.user?.id) return { status: 406, error: "😨You cannot bresil the bot!" }

		await client.updateDBUser(mover)
		await client.updateDBUser(moved)

		const movedUser = await client.prisma.bresil_count.upsert({
			where: {
				user_id: moved.user.id
			},
			update: {
				bresil_received: {
					increment: 1
				}
			},
			create: {
				user_id: moved.user.id,
				bresil_received: 1,
				bresil_sent: 0
			}
		})

		const moverUser = await client.prisma.bresil_count.upsert({
			where: {
				user_id: mover.user.id
			},
			update: {
				bresil_sent: {
					increment: 1
				}
			},
			create: {
				user_id: mover.user.id,
				bresil_received: 0,
				bresil_sent: 1
			}
		})

		const moveCount = movedUser.bresil_received
		const moverCount = moverUser.bresil_sent

		await handleAchievements(client, AchievementType.BrasilRecieved, moved.id, moveCount)
		await handleAchievements(client, AchievementType.BrasilSent, mover.id, moverCount)

		const brasilChannel = client.channels.cache.get(client.config.brasilChannelID)
		if (!brasilChannel) return { status: 406, error: "Brasil channel not found!" }

		if (!isVoiceChannel(brasilChannel)) return { status: 406, error: "Brasil channel is not a voice channel!" }

		await moved.voice.setChannel(brasilChannel)
		return {
			status: 200,
			message: `You have moved ${moved.user.username} to the brasil channel! You have moved ${moveCount} people and have been moved ${moverCount} times!`,
			moverCount,
			moveCount
		}
	} catch (err) {
		Logger.error(err)
		return { status: 500, error: err }
	}
}
