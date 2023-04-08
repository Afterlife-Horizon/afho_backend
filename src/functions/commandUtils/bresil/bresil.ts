import { GuildMember, VoiceChannel } from "discord.js"
import BotClient from "../../../botClient/BotClient"
import { Logger } from "../../../logger/Logger"

export default async function bresil(client: BotClient, mover: GuildMember, moved: GuildMember) {
	try {
		const guild = await client.guilds.fetch(client.config.serverID)
		if (!guild) return { status: 406, error: "Guild not found!" }

		const voiceChannel = mover.voice
		const movedVoiceChannel = moved.voice

		if (!voiceChannel) return { status: 406, error: "You are not in a channel!" }
		if (!movedVoiceChannel) return { status: 406, error: "The user you want to move is not in a channel!" }
		if (voiceChannel.id !== movedVoiceChannel.id) return { status: 406, error: "You are not in the same channel!" }
		if (movedVoiceChannel.id === client.config.brasilChannelID) return { status: 406, error: "You cannot bresil someone already in bresil!" }

		const movedUser = await client.prisma.bot_bresil.upsert({
			where: {
				id: moved.user.id
			},
			update: {
				bresil_received: {
					increment: 1
				}
			},
			create: {
				id: moved.user.id,
				username: moved.user.username,
				bresil_received: 1,
				bresil_sent: 0
			}
		})

		const moverUser = await client.prisma.bot_bresil.upsert({
			where: {
				id: mover.user.id
			},
			update: {
				bresil_sent: {
					increment: 1
				}
			},
			create: {
				id: mover.user.id,
				username: mover.user.username,
				bresil_received: 0,
				bresil_sent: 1
			}
		})

		const moveCount = movedUser.bresil_received
		const moverCount = moverUser.bresil_sent

		const brasilChannel = (await client.channels.fetch(client.config.brasilChannelID)) as VoiceChannel
		await moved.voice.setChannel(brasilChannel)
		return {
			status: 200,
			message: `You have moved ${moved.user.username} to the brasil channel! You have moved ${moveCount} people and have been moved ${moverCount} times!`,
			moverCount,
			moveCount
		}
	} catch (err) {
		if (err instanceof Error) Logger.error(err.message)
		return { status: 500, error: err }
	}
}
