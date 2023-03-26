import express = require("express");
const router = express.Router();
import path = require("path");
import { writeJsonFile } from "../../util/commonFuncs";

module.exports = function (client) {
	const favsPath = path.join(
		process.env.WORKPATH,
		"./config/TestUserFavs.json"
	);
	return router.post("/", async (req, res) => {
		try {
			const userId = req.body.userId;
			if (!client.ready) return res.status(406).send("Loading!");
			if (!userId) return res.status(400).json({ error: "No userId" });

			let favs = client.favs[req.body.userId];
			if (!favs) {
				client.favs[req.body.userId] = [];
				writeJsonFile(favsPath, JSON.stringify(client.favs));
				favs = [];
			}
			res.status(200).json({ favs });
		} catch (err) {
			console.log(err);
			res.status(500).send("Internal Server Error");
		}
	});
};
