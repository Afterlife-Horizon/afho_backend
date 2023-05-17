import express = require("express")
const router = express.Router()
import { AudioPlayerStatus, VoiceConnection, VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice"
import type BotClient from "../../../botClient/BotClient"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.get("/", async (req, res) => {
		try {
			if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
			const guild = await client.guilds.fetch(client.config.serverID)
			if (!guild) return res.status(406).send("Server not found!")

			const admins = guild.roles.cache.get(client.config.adminRoleID)?.members
			if (!admins) return res.status(406).send("Admins not found!")

			const queue = client.queues.get(guild.id)

			let curPos = 0
			let oldConnection: VoiceConnection | undefined
			const currentChannel = client.currentChannel
			if (currentChannel) oldConnection = getVoiceConnection(currentChannel.guild.id)

			const state = oldConnection?.state
			if (state?.status === VoiceConnectionStatus.Ready && state?.subscription?.player.state.status === AudioPlayerStatus.Playing) {
				const ressource = state?.subscription?.player.state?.resource
				if (oldConnection && client.queues.size !== 0 && queue) curPos = ressource ? ressource.playbackDuration : 0
			}

			const data = {
				queue: client.queues,
				prog: curPos,
				formatedprog: client.formatDuration(curPos),
				admins: {
					admins: admins.map(admin => [admin.user, admin]),
					usernames: admins.map(admin => admin.user.username)
				}
			}

			res.send(data)
		} catch (err) {
			Logger.error(JSON.stringify(err))
			res.status(500).json({ error: err })
		}
	})
}
