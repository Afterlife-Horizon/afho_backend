import { getVoiceConnection } from "@discordjs/voice"
import BotClient from "../BotClient"
import { AuditLogEvent } from "discord.js"

export default function (client: BotClient) {
	return client.on("voiceStateUpdate", async (oldState, newState) => {
		if (newState.id == client.user?.id) return

		function stateChange(one, two) {
			return (one === false && two === true) || (one === true && two === false)
		}

		// const fetchedLogs = await newState.guild.fetchAuditLogs({
		// 	type: AuditLogEvent.MemberMove,
		// 	limit: 1
		// })

		// const firstEntry = fetchedLogs.entries.first()

		// console.log(firstEntry)

		// if (firstEntry?.extra.channel.id == newState.channelId) {
		// 	if (firstEntry?.target?.id == newState.id) {
		// 		if (firstEntry?.executor?.id == client.user?.id) return
		// 		console.log("moved by " + firstEntry?.executor?.tag)
		// 	}
		// }

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
