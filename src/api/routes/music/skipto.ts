import express = require("express")
const router = express.Router()
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import BotClient from "../../../botClient/BotClient"
import { Channel, GuildMember, TextChannel, User, VoiceChannel } from "discord.js"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		const guild = client.guilds.cache.find((g: { name: string }) => g.name === client.config.serverName)
		if (!guild) return res.status(406).send("Guild not found!")
		await guild.members.fetch()
		await guild.channels.fetch()
		const connectedMembers = guild.members.cache.filter((member: { voice: { channel: any } }) => member.voice.channel)
		const requester = connectedMembers.filter((member: { user: { username: any } }) => member.user.username === req.body.user)
		const voiceChannel = guild.channels.cache.find(
			(c: Channel) => c.type === 2 && c.members.filter((m: GuildMember) => m.user.username === req.body.user).size !== 0
		)

		if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!")
		else if (voiceChannel?.id !== client.currentChannel?.id) return res.status(406).send("Not the same channel!")

		const textChannel = (await client.channels.fetch(client.config.baseChannelId)) as TextChannel
		if (!client.currentChannel) return res.status(406).send("not connected!")

		const queue = client.queues.get(client.currentChannel.guild.id)

		const oldConnection = getVoiceConnection(client.currentChannel.guild.id)
		if (!oldConnection) {
			res.status(406).send("")
			return textChannel.send({ content: `👎 **I'm not connected somewhere**!` }).catch((err: any) => console.log(err))
		}

		if (!queue) {
			res.status(406).send("")
			return textChannel.send(`👎 **Nothing playing right now**`).catch((err: any) => console.log(err))
		}

		if (!queue.tracks || queue.tracks.length <= 1) {
			res.status(406).send("")
			return textChannel.send(`👎 **Nothing to skip**`).catch((err: any) => console.log(err))
		}
		const arg = req.body.queuePos

		if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
			res.status(406).send("")
			return textChannel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't skip to ${arg}th Song.**` })
		}

		if (queue.queueloop) {
			for (let i = 1; i <= arg - 1; i++) {
				queue.tracks.push(queue.tracks[i])
			}
		}

		queue.tracks = queue.tracks.slice(arg - 1)

		const state = oldConnection.state as VoiceConnectionReadyState
		if (!state || !state.subscription) {
			res.status(406).send("")
			return textChannel.send(`👎 **Something went wrong**`).catch((err: any) => console.log(err))
		}

		state.subscription.player.stop()
		res.status(200).send("OK")
		return textChannel.send(`⏭️ **Successfully skipped ${arg} Track(s)**`).catch((err: any) => console.log(err))
	})
}
