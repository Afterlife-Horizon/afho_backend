import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
import { Logger } from "../../../logger/Logger"
const router = express.Router()

export default function delFav(client: BotClient) {
	return router.delete("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = await client.guilds.fetch(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = await guild.members.fetch(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const userId = user.data?.user?.user_metadata.provider_id
			const id = req.body.id

			if (!userId) return res.status(400).json({ error: "No userId" })
			if (!id) return res.status(400).json({ error: "No song id given" })

			await client.prisma.bot_favorites.delete({
				where: {
					id_user_id: {
						id,
						user_id: userId
					}
				}
			})

			const prevFavs = client.favs.get(userId) || []
			const newFavs = prevFavs.filter((fav: IFavorite) => fav.id !== id)

			client.favs.set(userId, newFavs)

			res.status(200).json({ data: client.favs.get(userId) })
		} catch (err) {
			if (err instanceof Error) Logger.error(err.message)
			res.status(500).json({ error: err })
		}
	})
}
