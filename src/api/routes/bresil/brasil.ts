import express from "express"
const router = express.Router()
import { Colors, EmbedBuilder, TextChannel } from "discord.js"
import type BotClient from "../../../botClient/BotClient"
import bresil from "../../../functions/commandUtils/bresil/bresil"
import { Logger } from "../../../logger/Logger"
import { isTextChannel } from "../../../functions/discordUtils"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const { moverId, movedId } = req.body
			if (!moverId || !movedId) return res.status(406).json({ error: "Bad Request!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).json({ error: "Guild not found!" })

			const logChannel = await guild.channels.fetch(client.config.baseChannelID)
			if (!logChannel) return res.status(406).json({ error: "Log Channel not found!" })
			if (!isTextChannel(logChannel)) return res.status(406).json({ error: "Log Channel is not a text channel!" })
			const mover = guild?.members.cache.get(moverId)
			const member = guild?.members.cache.get(movedId)
			if (!mover || !member) return res.status(406).json({ error: "Member not found!" })

			const result = await bresil(client, mover, member)
			if (result.status !== 200) return res.status(result.status).json({ error: result.error })

			await logChannel.send({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Green)
						.setAuthor({ name: mover.user.tag })
						.setDescription(result.message ? result.message : "Bresil moved!")
						.setTimestamp(new Date())
				]
			})
			res.status(200).send({ message: result.message ? result.message : "Bresil moved!" })
		} catch (err) {
			Logger.error(JSON.stringify(err))
			res.status(500).json({ error: "Internal error!" })
		}
	})
}
