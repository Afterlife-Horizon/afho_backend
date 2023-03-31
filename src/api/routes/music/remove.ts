import express = require("express")
const router = express.Router()
import { getVoiceConnection } from "@discordjs/voice"

export default function (client) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
		const connectedMembers = await guild.members.cache.filter(member => member.voice.channel)
		const requester = connectedMembers.filter(member => member.user.username === req.body.user)
		const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0)

		if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!")
		else if (voiceChannel.id !== client.currentChannel.id) return res.status(406).send("Not the same channel!")

		const channel = await client.channels.fetch(client.config.baseChannelId)
		if (!client.currentChannel) return res.status(406).send("not connected!")

		const queue = client.queues.get(client.currentChannel.guild.id)

		const oldConnection = getVoiceConnection(client.currentChannel.guild.id)
		if (!oldConnection) {
			res.status(406).send("")
			return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(err => console.log(err))
		}

		if (!queue) {
			res.status(406).send("")
			return channel.send(`👎 **Nothing playing right now**`).catch(err => console.log(err))
		}

		if (!queue.tracks || queue.tracks.length <= 1) {
			res.status(406).send("")
			return channel.send(`👎 **Nothing to remove**`).catch(err => console.log(err))
		}
		const arg = req.body.queuePos

		if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
			res.status(406).send("")
			return channel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${arg}th Song.**` })
		}

		queue.skipped = true

		queue.tracks.splice(arg, 1)

		res.status(200).send("OK")
		return channel.send(`⏭️ **Successfully removed track number ${arg}**`).catch(err => console.log(err))
	})
}
