import { getVoiceConnection } from "@discordjs/voice"
import BotClient from "../../../botClient/BotClient"

export default function shuffle(client: BotClient, user: string) {
	const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
	const member = guild?.members.cache.find(m => m.user.username === user)
	if (!guild || !member) return { status: 500, error: "👎 **Something went wrong**" }

	if (!member.voice.channelId) return { status: 406, error: "👎 **Please join a Voice-Channel first!**" }

	const oldConnection = getVoiceConnection(guild.id)
	if (!oldConnection) return { status: 406, error: "👎 **I'm not connected somewhere!**" }
	if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
		return { status: 406, error: "👎 **We are not in the same Voice-Channel**!" }

	const queue = client.queues.get(guild.id)
	if (!queue) return { status: 406, error: "👎 **Nothing playing right now**" }

	const tmpsong = queue.tracks[0]
	queue.tracks = shuffleArray(queue.tracks.slice(1))
	if (queue.tracks.length === 0) return { status: 400, message: "👎 **The Queue is empty!**" }
	queue.tracks.unshift(tmpsong)

	return { status: 200, message: "🔀 **Successfully shuffled the Queue!**" }
}

function shuffleArray(a) {
	let cI = a.length,
		rI
	while (cI != 0) {
		rI = Math.floor(Math.random() * cI)
		cI--
		;[a[cI], a[rI]] = [a[rI], a[cI]]
	}
	return a
}
