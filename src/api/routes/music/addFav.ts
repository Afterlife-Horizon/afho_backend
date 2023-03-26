import express = require("express");
const router = express.Router();
import { Playlist, Video, default as YouTube } from "youtube-sr";
import BotClient from "../../../botClient/BotClient";
import { IFavorite } from "../../../types";

export default function (client: BotClient) {
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

			let vid: Playlist | Video | undefined = undefined;
			if (isYoutube && isYoutubeSong && !isYoutubePlaylist) {
				vid = await YouTube.getVideo(url);
			} else if (isYoutube && isYoutubePlaylist && isYoutubeSong) {
				vid = await YouTube.getVideo(url);
			} else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) {
				vid = await YouTube.getPlaylist(url);
			} else {
				vid = await YouTube.searchOne(url);
			}
			if (!vid) return res.status(400).json({ error: "No video found" });

			const newFav : IFavorite = {
				name: vid.title,
				url: vid.url,
				thumbnail: vid.thumbnail?.url,
			};

			client.dbClient.updateDB("INSERT INTO bot_favorites (user_id, name, url, thumbnail) VALUES (?, ?, ?, ?)", [userId, newFav.name, newFav.url, newFav.thumbnail], (err) => {
				if (err) {
					console.log(err);
					return res.status(500).send("Internal Server Error");
				}
			})

			const favs : IFavorite[] = client.favs[req.body.userId] || [];
			favs.push(newFav);
			client.favs[req.body.userId] = favs;

			res.status(200).json({ data: client.favs[req.body.userId] });
		} catch (err: any) {
			console.log(err);
			res.status(500).json({ error: err });
		}
	});
}
