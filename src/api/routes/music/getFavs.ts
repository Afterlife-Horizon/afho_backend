import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const access_token = req.body.access_token

			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)

			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const userId = member.user.id

			let favorites: IFavorite[] = []
			client.dbClient.selectFromDB("SELECT * FROM bot_favorites WHERE user_id = ?", [userId], (err, result) => {
				if (err) {
					console.log(err)
					return res.status(500).send("Internal Server Error")
				} else {
					favorites = result.map(fav => {
						return {
							name: fav.name,
							url: fav.url,
							thumbnail: fav.thumbnail
						}
					})
				}
			})

			res.status(200).json({ favorites })
		} catch (err) {
			console.log(err)
			res.status(500).send("Internal Server Error")
		}
	})
}
