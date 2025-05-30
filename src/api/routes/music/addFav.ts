import express = require("express")
const router = express.Router()
import { Favorite } from "#/types"
import { Playlist, Video, default as YouTube } from "youtube-sr"
import type BotClient from "#/botClient/BotClient"
import getSongNameFromSpotify from "#/functions/getInfoFromSpotify"
import { Logger } from "#/logger/Logger"

export default function (client: BotClient) {
    return router.post("/", async (req, res) => {
        if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            const access_token = req.body.access_token
            if (!access_token) return res.status(406).send({ error: "No Access Token!" })

            const user = await client.supabaseClient.auth.getUser(access_token)
            if (!user || user.error) return res.status(406).send({ error: "Invalid Access Token!" })

            const guild = client.guilds.cache.get(client.config.serverID)
            if (!guild) return res.status(406).send({ error: "Server not found!" })

            const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
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
                } else if (isSpotifyPlaylist && !isSpotifySong)
                    return res.status(400).json({
                        error: `Spotify playlists are not supported yet!`
                    })
                else if (isSpotifyPlaylist && isSpotifySong) {
                    const spotifyInfo = await getSongNameFromSpotify(client, url)
                    vid = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
                } else {
                    const spotifyInfo = await getSongNameFromSpotify(client, url)
                    vid = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
                }
            }

            if (!vid) return res.status(400).json({ error: "No video found" })

            await client.cacheHandler.updateDBUser(member)

            let newFav: Favorite | undefined = undefined
            try {
                const res = await client.prisma.videos.create({
                    data: {
                        id: vid.id ? vid.id : "",
                        name: vid.title ? vid.title : "",
                        url: vid.url ? vid.url : "",
                        thumbnail: vid.thumbnail?.url ? vid.thumbnail?.url : "",
                        type: vid.type === "playlist" ? "playlist" : "video"
                    }
                })
                newFav = { userId, ...res }
            } catch (err: any) {
                if (err.code === "P2002") {
                    const row = await client.prisma.videos.findUnique({
                        where: {
                            id: vid.id ? vid.id : ""
                        }
                    })
                    if (!row) return res.status(500).json({ error: "Internal Error!" })
                    newFav = { userId, ...row }
                } else {
                    Logger.error(err)
                    return res.status(500).json("Internal Error!")
                }
            }

            await client.prisma.favorites.create({
                data: {
                    user_id: userId,
                    video_id: vid.id ? vid.id : ""
                }
            })

            const favs = client.cacheHandler.favs.get(userId) || []
            favs.push(newFav)
            client.cacheHandler.favs.set(userId, favs)

            res.status(200).json({ data: newFav })
        } catch (err: any) {
            if (err.code === "P2002") return res.status(400).json({ error: "Already in favorites" })
            Logger.error(err)
            res.status(500).json({ error: err })
        }
    })
}
