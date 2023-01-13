const express = require("express");
const router = express.Router();
const path = require("path");
const { default: YouTube } = require("youtube-sr");
const { writeJsonFile } = require("../../util/commonFuncs");

module.exports = function (client) {
	const favsPath = path.join(
		process.env.WORKPATH,
		"./config/TestUserFavs.json"
	);
	return router.post("/", async (req, res) => {
		try {
			const userId = req.body.userId;
			const url = req.body.url;
			if (!client.ready) return res.status(406).send("Loading!");

			if (!userId) return res.status(400).json({ error: "No userId" });
			if (!url) return res.status(400).json({ error: "No url" });

			const vid = await YouTube.searchOne(url);
			if (!vid) return res.status(400).json({ error: "No video found" });
			const newFav = {
				name: vid.title,
				url: vid.url,
				thumbnail: vid.thumbnail.url,
			};

			let favs = client.favs[req.body.userId];
			if (!favs) {
				client.favs[req.body.userId] = [newFav];
				writeJsonFile(favsPath, JSON.stringify(client.favs));
				return res.status(200).json({ msg: "OK" });
			}
			favs.push(newFav);
			client.favs[req.body.userId] = favs;
			writeJsonFile(favsPath, JSON.stringify(client.favs));
			res.status(200).json({ data: client.favs[req.body.userId] });
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: err.message });
		}
	});
};
