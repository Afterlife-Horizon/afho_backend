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
			const url = req.body.index;
			if (!client.ready) return res.status(406).send("Loading!");

			if (!userId) return res.status(400).json({ error: "No userId" });
			if (!index) return res.status(400).json({ error: "No index" });

			let favs = client.favs[req.body.userId];
			if (!favs) {
				return res.status(400).json({ msg: "nothing to delete" });
			}
			if (index > favs.length || index < 0) {
				return res.status(400).json({ msg: "index out of bounds" });
			}
			favs.pop(index);
			client.favs[req.body.userId] = favs;
			writeJsonFile(favsPath, JSON.stringify(client.favs));
			res.status(200).json({ data: client.favs[req.body.userId] });
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: err.message });
		}
	});
};
