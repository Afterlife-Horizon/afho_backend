import { getVoiceConnection } from "@discordjs/voice"
import BotClient from "../BotClient"
import { AuditLogEvent, VoiceState } from "discord.js"
import { Logger } from "../../logger/Logger"
import { handleAchievements } from "../../functions/handleAchievements"
import { AchievementType } from "../../types/achievements"

export default function (client: BotClient) {
	return client.on("voiceStateUpdate", async (oldState, newState) => {
		if (newState.id == client.user?.id) return

		client.updateCache()

		switch (getStateAction(oldState, newState)) {
			case "join":
				handleUpdateTimer(true, oldState, newState)
				if (!newState.member) return
				client.connectedMembers.set(newState.member.id, newState.member.user)
				break
			case "leave":
				handleUpdateTimer(false, oldState, newState)
				handleChannelLeave(oldState, newState)
				if (!oldState.member?.id) return
				client.connectedMembers.delete(oldState.member.id)
				break
			case "join" || "server undeafen" || "self undeafen" || "server unmute" || "self unmute":
				handleUpdateTimer(true, oldState, newState)
				break
			case "server deafen" || "self deafen" || "server mute" || "self mute":
				handleUpdateTimer(false, oldState, newState)
				break
			case "server deafen":
				handleUpdateTimer(false, oldState, newState)
				break
			case "move":
				await handleChannelMove(newState)
				break
		}
	})

	function getStateAction(oldState: VoiceState, newState: VoiceState) {
		if (!newState.channelId && oldState.channelId) {
			Logger.log(`User ${oldState.member?.user.username} left ${oldState.channel?.name} in ${oldState.guild.name}`)
			return "leave"
		}
		if (newState.channelId && !oldState.channelId) {
			Logger.log(`User ${newState.member?.user.username} joined ${newState.channel?.name} in ${newState.guild.name}`)
			return "join"
		}

		// --------- Server deafen / undeafened ---------
		if (!oldState.serverDeaf && newState.serverDeaf) {
			Logger.log(`User ${oldState.member?.user.username} was deafened in ${oldState.guild.name}`)
			return "server deafen"
		}
		if (oldState.serverDeaf && !newState.serverDeaf) {
			Logger.log(`User ${oldState.member?.user.username} was undeafened in ${oldState.guild.name}`)
			return "server undeafen"
		}

		// --------- Self deafen / undeafened ---------
		if (!oldState.selfDeaf && newState.selfDeaf) {
			Logger.log(`User ${oldState.member?.user.username} was deafened in ${oldState.guild.name}`)
			return "self deafen"
		}
		if (oldState.selfDeaf && !newState.selfDeaf) {
			Logger.log(`User ${oldState.member?.user.username} was undeafened in ${oldState.guild.name}`)
			return "self undeafen"
		}

		// --------- Server Mute / Unmute ---------
		if (!oldState.serverMute && newState.serverMute) {
			Logger.log(`User ${oldState.member?.user.username} was muted in ${oldState.guild.name}`)
			return "server mute"
		}
		if (oldState.serverMute && !newState.serverMute) {
			Logger.log(`User ${oldState.member?.user.username} was unmuted in ${oldState.guild.name}`)
			return "server unmute"
		}

		// --------- Self Mute / Unmute ---------
		if (!oldState.selfMute && newState.selfMute) {
			Logger.log(`User ${oldState.member?.user.username} was muted in ${oldState.guild.name}`)
			return "self mute"
		}
		if (oldState.selfMute && !newState.selfMute) {
			Logger.log(`User ${oldState.member?.user.username} was unmuted in ${oldState.guild.name}`)
			return "self unmute"
		}

		if (oldState.channelId && newState.channelId && oldState.channelId != newState.channelId) {
			Logger.log(
				`User ${newState.member?.user.username} moved from ${oldState.channel?.name} to ${newState.channel?.name} in ${newState.guild.name}`
			)
			return "move"
		}

		return "none"
	}

	function handleUpdateTimer(enter: boolean, oldState: VoiceState, newState: VoiceState) {
		if (enter) {
			if (!newState.member?.id) return Logger.log("No member id found")
			if (!newState.guild.id) return Logger.log("No guild id found")
			if (!newState.channelId) return Logger.log("No channel id found")
			if (newState.member.id == client.user?.id) return

			client.times.set(newState.member.id, new Date())
		}

		if (!enter) {
			if (!oldState.member?.id) return
			if (oldState.member.id == client.user?.id) return

			client.pushTime(oldState.member.id)
			client.times.delete(oldState.member.id)
		}
	}

	async function handleChannelMove(newState: VoiceState) {
		const fetchedLogs = await newState.guild.fetchAuditLogs({
			type: AuditLogEvent.MemberMove,
			limit: 1
		})

		const firstEntry = fetchedLogs.entries.first()

		if (!firstEntry) return

		if (firstEntry?.extra.channel.id == newState.channelId) {
			if (firstEntry?.executor?.id == client.user?.id) return
			if (!(newState.channel?.id == client.config.brasilChannelID)) return

			const mover = client.guilds.cache.get(client.config.serverID)?.members.cache.get(firstEntry.executor?.id || "")
			const moved = newState.member

			if (!mover || !moved) return

			await client.updateDBUser(mover)
			await client.updateDBUser(moved)

			const moved_count = await client.prisma.bresil_count.upsert({
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

			const mover_count = await client.prisma.bresil_count.upsert({
				where: {
					user_id: mover.id
				},
				update: {
					bresil_sent: {
						increment: 1
					}
				},
				create: {
					user_id: mover.id,
					bresil_received: 0,
					bresil_sent: 1
				}
			})

			await handleAchievements(client, AchievementType.BrasilRecieved, moved.user.id, moved_count.bresil_received)
			await handleAchievements(client, AchievementType.BrasilSent, mover.id, mover_count.bresil_sent)
		}
	}

	function handleChannelLeave(oldState: VoiceState, newState: VoiceState) {
		setTimeout(() => {
			const connection = getVoiceConnection(newState.guild.id)
			if (oldState.channel ? oldState.channel.members.filter(m => !m.user.bot).size >= 1 : true) return
			if (connection && connection.joinConfig.channelId == oldState.channelId) connection.disconnect()
		}, 15000)
	}
}
