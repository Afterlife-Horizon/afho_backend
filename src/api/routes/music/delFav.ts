import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
const router = express.Router()

export default function delFav(client: BotClient) {
	return router.delete("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverId)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const userId = member.user.id
			const name = req.body.name

			if (!userId) return res.status(400).json({ error: "No userId" })
			if (!name) return res.status(400).json({ error: "No song name" })

			await client.prisma.bot_favorites.delete({
				where: {
					id_user_id: {
						id: name,
						user_id: userId
					}
				}
			})

			client.favs[userId] = client.favs[userId].filter((fav: IFavorite) => fav.name !== name)

			res.status(200).json({ data: client.favs[userId] })
		} catch (err) {
			console.log(err)
			res.status(500).json({ error: err })
		}
	})
}
