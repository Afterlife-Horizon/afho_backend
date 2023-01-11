const express = require("express");
const router = express.Router();
const path = require("path");
const { writeJsonFile } = require("../../util/commonFuncs");

module.exports = function (client) {
	const favsPath = path.join(
		process.env.WORKPATH,
		"./config/TestUserFavs.json"
	);
	return router.delete("/", async (req, res) => {
		try {
			const userId = req.body.userId;
			const index = req.body.index;
			if (!client.ready) return res.status(406).send("Loading!");

			if (!userId) return res.status(400).json({ error: "No userId" });
			if (typeof index !== "number" || index > favs.length || index < 0)
				return res.status(400).json({ error: "invalid index" });

			let favs = client.favs[req.body.userId];
			if (!favs) {
				return res.status(400).json({ error: "nothing to delete" });
			}

			if (index === 0 || favs.length === 1) {
				client.favs[req.body.userId]?.pop();
				writeJsonFile(favsPath, JSON.stringify(client.favs));
				return res.status(200).json({ data: client.favs[req.body.userId] });
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
