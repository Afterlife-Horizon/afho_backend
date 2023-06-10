import express = require("express")
const router = express.Router()
import { Logger } from "../../../logger/Logger"
import type BotClient from "../../../botClient/BotClient"

export default function delFav(client: BotClient) {
	return router.delete("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const userId = user.data?.user?.user_metadata.provider_id
			const id = req.body.id

			if (!userId) return res.status(400).json({ error: "No userId" })
			if (!id) return res.status(400).json({ error: "No song id given" })

			await client.prisma.favorites.delete({
				where: {
					user_id_video_id: {
						user_id: userId,
						video_id: id
					}
				}
			})

			const prevFavs = client.favs.get(userId) || []
			const newFavs = prevFavs.filter(fav => fav.id !== id)
			client.favs.set(userId, newFavs)

			res.status(200).json({ data: client.favs.get(userId) })
		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: err })
		}
	})
}
