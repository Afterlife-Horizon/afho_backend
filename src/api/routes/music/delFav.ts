import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
const router = express.Router()

export default function delFav(client: BotClient) {
	return router.delete("/", async (req, res) => {
		try {
			const userId = req.body.userId
			const name = req.body.name

			if (!client.ready) return res.status(406).send("Loading!")
			if (!userId) return res.status(400).json({ error: "No userId" })
			if (!name) return res.status(400).json({ error: "No song name" })

			client.dbClient.updateDB("DELETE FROM bot_favorites WHERE user_id = ? AND name = ?", [userId, name], err => {
				if (err) {
					console.log(err)
					return res.status(500).send("Internal Server Error")
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
