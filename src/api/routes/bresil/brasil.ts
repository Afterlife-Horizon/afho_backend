import express from "express"
const router = express.Router()
import { Colors, EmbedBuilder, TextChannel } from "discord.js"
import BotClient from "../../../botClient/BotClient"
import bresil from "../../../functions/commandUtils/bresil/bresil"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const { moverId, movedId } = req.body
			const logChannel = client.channels.cache.get(client.config.baseChannelID) as TextChannel
			const mover = client.guilds.cache.get(client.config.serverID)?.members.cache.get(moverId)
			const member = client.guilds.cache.get(client.config.serverID)?.members.cache.get(movedId)
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
			if (err instanceof Error) Logger.error(err.message)
			res.status(500).json({ error: "Internal error!" })
		}
	})
}
