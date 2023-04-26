import express from "express"
const router = express.Router()
import { Colors, EmbedBuilder, TextChannel } from "discord.js"
import type BotClient from "../../../botClient/BotClient"
import bresil from "../../../functions/commandUtils/bresil/bresil"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const { moverId, movedId } = req.body
			if (!moverId || !movedId) return res.status(406).json({ error: "Bad Request!" })

			const guild = await client.guilds.fetch(client.config.serverID)

			const logChannel = (await guild.channels.fetch(client.config.baseChannelID)) as TextChannel
			const mover = await guild?.members.fetch(moverId)
			const member = await guild?.members.fetch(movedId)
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
