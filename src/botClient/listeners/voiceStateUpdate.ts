import { getVoiceConnection } from "@discordjs/voice"
import BotClient from "../BotClient"
import { AuditLogEvent } from "discord.js"
import { Logger } from "../../logger/Logger"

export default function (client: BotClient) {
	return client.on("voiceStateUpdate", async (oldState, newState) => {
		if (newState.id == client.user?.id) return

		function stateChange(one, two) {
			return (one === false && two === true) || (one === true && two === false)
		}

		if (
			stateChange(oldState.streaming, newState.streaming) ||
			stateChange(oldState.serverDeaf, newState.serverDeaf) ||
			stateChange(oldState.serverMute, newState.serverMute) ||
			stateChange(oldState.selfDeaf, newState.selfDeaf) ||
			stateChange(oldState.selfMute, newState.selfMute) ||
			stateChange(oldState.selfVideo, newState.selfVideo) ||
			stateChange(oldState.suppress, newState.suppress)
		) {
			return
		}

		// channel joins
		if (!oldState.channelId && newState.channelId) return

		// channel moves
		if (oldState.channelId && newState.channelId && oldState.channelId != newState.channelId) {
			const fetchedLogs = await newState.guild.fetchAuditLogs({
				type: AuditLogEvent.MemberMove,
				limit: 1
			})

			const firstEntry = fetchedLogs.entries.first()

			if (firstEntry?.extra.channel.id == newState.channelId) {
				if (firstEntry?.executor?.id == client.user?.id) return
				if (!(newState.channel?.id == client.config.brasilChannelID)) return

				const mover = firstEntry.executor
				const moved = newState.member

				if (!mover || !moved) return

				await client.prisma.bot_bresil.upsert({
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

				await client.prisma.bot_bresil.upsert({
					where: {
						id: mover.id
					},
					update: {
						bresil_sent: {
							increment: 1
						}
					},
					create: {
						id: mover.id,
						username: mover.username,
						bresil_received: 0,
						bresil_sent: 1
					}
				})
			}

			Logger.log(
				`User ${newState.member?.user.username} moved from ${oldState.channel?.name} to ${newState.channel?.name} in ${newState.guild.name}`
			)

			return
		}

		// channel leaves
		if ((!newState.channelId && oldState.channelId) || (newState.channelId && oldState.channelId)) {
			setTimeout(() => {
				const connection = getVoiceConnection(newState.guild.id)
				if (oldState.channel ? oldState.channel.members.filter(m => !m.user.bot).size >= 1 : true) return
				if (connection && connection.joinConfig.channelId == oldState.channelId) connection.destroy()
				return
			}, 15000)
		}
	})
}
