import { getVoiceConnection, VoiceConnectionReadyState } from "@discordjs/voice"
import type BotClient from "../../../botClient/BotClient"

export default async function skip(client: BotClient, user: string) {
	const guild = await client.guilds.fetch(client.config.serverID)
	const member = guild?.members.cache.find(m => m.user.username === user)
	if (!member || !guild) return { status: 500, error: "👎 **Something went wrong**" }
	if (!member.voice.channelId) return { status: 406, error: "👎 **Please join a Voice-Channel first!**" }

	const oldConnection = getVoiceConnection(guild.id)

	if (!oldConnection) return { status: 406, error: "👎 **I'm not connected somewhere!**" }
	if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
		return { status: 406, error: "👎 **We are not in the same Voice-Channel**!" }

	const queue = client.queues.get(guild.id)
	if (!queue) return { status: 406, error: "👎 **Nothing playing right now**" }

	if (!queue.tracks || queue.tracks.length <= 1) {
		return { status: 406, error: "👎 **Nothing to skip**" }
	}
	queue.skipped = true

	const state = oldConnection.state as VoiceConnectionReadyState
	if (!state || !state.subscription) return { status: 500, error: "👎 **Something went wrong**" }

	state.subscription.player.stop()

	return { status: 200, message: "⏭️ **Successfully skipped the Track**" }
}
