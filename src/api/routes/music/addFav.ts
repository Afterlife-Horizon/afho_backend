import express = require("express")
const router = express.Router()
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { Logger } from "../../../logger/Logger"
import getSongNameFromSpotify from "../../../functions/getInfoFromSpotify"
import type BotClient from "../../../botClient/BotClient"
import type { IFavorite } from "../../../types/music"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user || user.error) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = await client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = await guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
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

			const spotifyRegex = /^.*(open\.spotify\.com)\/.+$/gi
			const spotifySongRegex = /^(https:\/\/open.spotify.com\/(track\/))(.*)$.*/gi
			const spotifyPlaylistRegex = /^https:\/\/open.spotify.com\/user\/spotify\/playlist\/([a-zA-Z0-9]+)(.*)$.*/gi
			const isSpotify = spotifyRegex.exec(url)
			const isSpotifySong = spotifySongRegex.exec(url)
			const isSpotifyPlaylist = spotifyPlaylistRegex.exec(url)

			let vid: Playlist | Video | undefined = undefined

			if (!isYoutube && !isSpotify) return res.status(400).json({ error: "Invalid url" })
			else if (isYoutube) {
				if (isYoutubeSong && !isYoutubePlaylist) vid = await YouTube.getVideo(url)
				else if (isYoutube && isYoutubePlaylist && isYoutubeSong) vid = await YouTube.getVideo(url)
				else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) vid = await YouTube.getPlaylist(url)
				else vid = await YouTube.searchOne(url)
			} else if (isSpotify) {
				if (isSpotifySong && !isSpotifyPlaylist) {
					const spotifyInfo = await getSongNameFromSpotify(client, url)
					vid = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
				} else if (isSpotifyPlaylist && !isSpotifySong) return res.status(400).json({ error: `Spotify playlists are not supported yet!` })
				else if (isSpotifyPlaylist && isSpotifySong) {
					const spotifyInfo = await getSongNameFromSpotify(client, url)
					vid = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
				} else {
					const spotifyInfo = await getSongNameFromSpotify(client, url)
					vid = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
				}
			}

			if (!vid) return res.status(400).json({ error: "No video found" })

			const newFav = await client.prisma.bot_favorites.create({
				data: {
					id: vid.id ? vid.id : "",
					user_id: userId,
					name: vid.title ? vid.title : "",
					url: vid.url ? vid.url : "",
					thumbnail: vid.thumbnail?.url ? vid.thumbnail?.url : "",
					type: vid.type === "playlist" ? "playlist" : "video"
				}
			})

			const data = {
				id: newFav.id,
				name: newFav.name,
				url: newFav.url,
				thumbnail: newFav.thumbnail,
				type: newFav.type as "video" | "playlist"
			}

			const favs: IFavorite[] = client.favs.get(req.body.userId) || []
			favs.push(data)
			client.favs.set(req.body.userId, favs)

			res.status(200).json({ data })
		} catch (err: any) {
			if (err.code === "P2002") return res.status(400).json({ error: "Already in favorites" })
			Logger.error(JSON.stringify(err))
			res.status(500).json({ error: err })
		}
	})
}
