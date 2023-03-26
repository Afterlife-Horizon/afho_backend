import express = require("express");
const router = express.Router();
import path = require("path");
import { writeJsonFile } from "../../util/commonFuncs";

export function delFav(client: any) {
	const favsPath = path.join(
		process.env.WORKPATH || "./",
		"./config/TestUserFavs.json"
	);
	return router.delete("/", async (req, res) => {
		try {
			const userId = req.body.userId;
			const index = req.body.index;
			if (!client.ready) return res.status(406).send("Loading!");

			if (!userId) return res.status(400).json({ error: "No userId" });
			let favs = client.favs[req.body.userId];
			if (!favs) {
				return res.status(400).json({ error: "nothing to delete" });
			}

			if (typeof index !== "number" || index > favs.length || index < 0)
				return res.status(400).json({ error: "invalid index" });

			if (index === 0) {
				favs.shift();
			} else {
				favs = favs.slice(0, index).concat(favs.slice(index + 1));
			}
			client.favs[req.body.userId] = favs;
			writeJsonFile(favsPath, JSON.stringify(client.favs));
			res.status(200).json({ data: client.favs[req.body.userId] });
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: err });
		}
	});
};
