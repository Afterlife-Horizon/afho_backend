import express = require("express");
const router = express.Router();
import path = require("path");
import { default as YouTube } from "youtube-sr";
import { writeJsonFile } from "../../util/commonFuncs";

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

			const youtubRegex =
				/^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
			const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
			const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;

			const isYoutube = youtubRegex.exec(url);
			const isYoutubeSong = songRegex.exec(url);
			const isYoutubePlaylist = playlistRegex.exec(url);

			let vid = null;
			if (isYoutube && isYoutubeSong && !isYoutubePlaylist) {
				vid = await YouTube.getVideo(url);
			} else if (isYoutube && isYoutubePlaylist && isYoutubeSong) {
				song = await YouTube.getVideo(url);
			} else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) {
				vid = await YouTube.getPlaylist(url);
			} else {
				vid = await YouTube.searchOne(url);
			}
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
