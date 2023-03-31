import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		try {
			const userId = req.body.userId
			if (!client.ready) return res.status(406).send("Loading!")
			if (!userId) return res.status(400).json({ error: "No userId" })

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
