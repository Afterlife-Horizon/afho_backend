import express = require("express")
const router = express.Router()
import { Playlist, Video, default as YouTube } from "youtube-sr"
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
import { Logger } from "../../../logger/Logger"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			if (!client.ready) return res.status(406).send({ error: "Loading!" })

			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user || user.error) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = await client.guilds.fetch(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = await guild.members.fetch(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const url = req.body.url
			const userId = member.user.id

			if (!url) return res.status(400).json({ error: "No url" })

			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
			const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
			const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi
			const isYoutube = youtubRegex.exec(url)
			const isYoutubeSong = songRegex.exec(url)
			const isYoutubePlaylist = playlistRegex.exec(url)

			let vid: Playlist | Video | undefined = undefined
			if (isYoutube && isYoutubeSong && !isYoutubePlaylist) vid = await YouTube.getVideo(url)
			else if (isYoutube && isYoutubePlaylist && isYoutubeSong) vid = await YouTube.getVideo(url)
			else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) vid = await YouTube.getPlaylist(url)
			else vid = await YouTube.searchOne(url)
			if (!vid) return res.status(400).json({ error: "No video found" })

			const newFav = await client.prisma.bot_favorites.create({
				data: {
					id: vid.id ? vid.id : "",
					user_id: userId,
					name: vid.title ? vid.title : "",
					url: vid.url ? vid.url : "",
					thumbnail: vid.thumbnail?.url ? vid.thumbnail?.url : ""
				}
			})

			const data = {
				id: newFav.id,
				name: newFav.name,
				url: newFav.url,
				thumbnail: newFav.thumbnail
			}

			const favs: IFavorite[] = client.favs.get(req.body.userId) || []
			favs.push(data)
			client.favs.set(req.body.userId, favs)

			res.status(200).json({ data })
		} catch (err: any) {
			if (err instanceof Error) Logger.error(err.message)
			res.status(500).json({ error: err })
		}
	})
}
