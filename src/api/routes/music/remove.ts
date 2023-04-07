import express = require("express")
const router = express.Router()
import { getVoiceConnection } from "@discordjs/voice"
import BotClient from "../../../botClient/BotClient"
import { TextChannel } from "discord.js"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

		const access_token = req.body.access_token

		if (!access_token) return res.status(406).send({ error: "No Access Token!" })

		const user = await client.supabaseClient.auth.getUser(access_token)

		if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

		const guild = await client.guilds.fetch(client.config.serverID)
		if (!guild) return res.status(406).send("Guild not found!")

		const connectedMembers = guild.members.cache.filter(member => member.voice.channel)
		const requester = connectedMembers.find(member => member.user.username === user.data.user?.user_metadata.full_name)
		const voiceChannel = guild.channels.cache.find(
			c => c.type === 2 && c.members.find(m => m.user.username === user.data.user?.user_metadata.full_name) !== undefined
		)

		if (!requester) return res.status(406).send("You are not connected to a voice channel!")
		else if (voiceChannel?.id !== client.currentChannel?.id) return res.status(406).send("Not the same channel!")

		const channel = (await client.channels.fetch(client.config.baseChannelID)) as TextChannel
		if (!channel) return res.status(406).send("Channel not found!")
		if (!client.currentChannel) return res.status(406).send("not connected!")

		const queue = client.queues.get(client.currentChannel.guild.id)

		const oldConnection = getVoiceConnection(client.currentChannel.guild.id)
		if (!oldConnection) {
			res.status(406).send("")
			return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(err => Logger.error(err.message))
		}

		if (!queue) {
			res.status(406).send("")
			return channel.send(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
		}

		if (!queue.tracks || queue.tracks.length <= 1) {
			res.status(406).send("")
			return channel.send(`👎 **Nothing to remove**`).catch(err => Logger.error(err.message))
		}
		const arg = req.body.queuePos

		if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
			res.status(406).send("")
			return channel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${arg}th Song.**` })
		}

		queue.skipped = true

		queue.tracks.splice(arg, 1)

		res.status(200).send("OK")
		return channel.send(`⏭️ **Successfully removed track number ${arg}**`).catch(err => Logger.error(err.message))
	})
}
