import express = require("express");
import BotClient from "../../../botClient/BotClient";
const router = express.Router();

export default function delFav(client: BotClient) {
	return router.delete("/", async (req, res) => {
		try {
			const userId = req.body.userId;
			const name = req.body.name;
			
			if (!client.ready) return res.status(406).send("Loading!");
			if (!userId) return res.status(400).json({ error: "No userId" });
			if (!name) return res.status(400).json({ error: "No song name" });

			client.dbClient.updateDB("DELETE FROM bot_favorites WHERE user_id = ? AND name = ?", [userId, name], (err) => {
				if (err) {
					console.log(err);
					return res.status(500).send("Internal Server Error");
				}
				else {
					client.dbClient.selectFromDB("SELECT * FROM bot_favorites WHERE user_id = ?", [userId], (err, result) => {
						if (err) {
							console.log(err);
							return res.status(500).send("Internal Server Error");
						}
						else {
							client.favs[userId] = result.map((fav) => {
								return {  
									name: fav.name,
									url: fav.url,
									thumbnail: fav.thumbnail
								};
							})
						}
					})
				}
			})

			res.status(200).json({ data: client.favs[userId] });
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: err });
		}
	});
}
