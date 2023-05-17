import express = require("express")
const router = express.Router()
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { ChannelType, DMChannel, TextChannel, VoiceChannel } from "discord.js"
import { Logger } from "../../../logger/Logger"
import type BotClient from "../../../botClient/BotClient"
import type { IESong } from "../../../types/music"
import { isTextChannel } from "functions/discordUtils"

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

		const access_token = req.body.access_token
		if (!access_token) return res.status(406).send({ error: "No Access Token!" })

		const user = await client.supabaseClient.auth.getUser(access_token)
		if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

		try {
			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Guild not found!" })
			const connectedMembers = guild.members.cache.filter(member => member.voice.channel)
			const requester = connectedMembers.find(member => member.user.username === user.data.user?.user_metadata.full_name)

			if (!requester) return res.status(406).send({ error: "You are not connected to a voice channel!" })

			const voiceChannel = guild.channels.cache.find(
				c => c && c.type === 2 && c.members.filter(m => m.user.username === user.data.user?.user_metadata.full_name).size > 0
			)
			if (client.currentChannel?.id !== voiceChannel?.id) return res.status(406).send({ error: "Not the same channel!" })
			if (!client.currentChannel) return res.status(406).send({ error: "not connected!" })

			const currentChannel = client.channels.cache.get(client.currentChannel.id)
			if (!currentChannel) return res.status(406).send({ error: "Channel not found!" })
			if (currentChannel.type !== ChannelType.GuildVoice) return res.status(406).send({ error: "Incorrect channel!" })

			const channel = client.channels.cache.get(client.config.baseChannelID)
			if (!channel) return res.status(406).send({ error: "Base channel not found!" })
			if (!isTextChannel(channel)) return res.status(406).send({ error: "Base channel is not a text channel!" })

			const queue = client.queues.get(currentChannel.guild.id)
			if (!queue) return res.status(406).send({ error: "No queue found!" })

			const track = req.body.songs
			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
			const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
			const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

			let song: Video | undefined = undefined
			let playlist: Playlist | undefined = undefined

			const isYT = youtubRegex.exec(track)
			const isSong = songRegex.exec(track)
			const isList = playlistRegex.exec(track)

			channel.send(`🔍 *Searching **${track}** ...*`)
			if (isYT && isSong && !isList) {
				song = await YouTube.getVideo(track)
			} else if (isYT && !isSong && isList) {
				playlist = await YouTube.getPlaylist(track).then(p => p.fetch())
			} else if (isYT && isSong && isList) {
				song = await YouTube.getVideo(`https://www.youtube.com/watch?v=${isSong[2]}`)
				playlist = await YouTube.getPlaylist(`https://www.youtube.com/playlist?list=${isList[2]}`).then(p => p.fetch())
			} else song = await YouTube.searchOne(track)

			if (!song && !playlist) {
				res.status(406).send({ error: "Failed looking up for ${track}!" })
				return channel.send(`❌ **Failed looking up for ${track}!**`)
			}
			if (!playlist) {
				const video = song as Video
				if (!queue) {
					res.status(406).send({ error: "No queue" })
					return channel.send({ content: `❗ No queue!` })
				}
				queue.tracks = [queue.tracks[0], client.createSong(video, user.data.user?.user_metadata.full_name), ...queue.tracks.slice(1)]
				res.status(200).send(`▶️ Queued at 1st: ${video.title} - ${video.durationFormatted}`)
				return channel.send(`▶️ **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\``)
			} else {
				song = song ? song : playlist.videos[0]

				const video = song as Video
				const index = playlist.videos.findIndex(s => s.id == video.id) || 0
				playlist.videos.splice(index, 1)
				const playlistSongs: IESong[] = []
				playlist.videos.forEach(nsong => playlistSongs.push(client.createSong(nsong, user.data.user?.user_metadata.full_name)))
				queue.tracks = [
					queue.tracks[0],
					client.createSong(video, user.data.user?.user_metadata.full_name),
					...playlistSongs,
					...queue.tracks.slice(1)
				]
				channel.send(
					`👍 **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\`\n> **Added \`${
						playlist.videos.length - 1
					} Songs\` from the Playlist:**\n> __**${playlist.title}**__`
				)
				res.status(200).send(
					`👍 **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\`\n> **Added \`${
						playlist.videos.length - 1
					} Songs\` from the Playlist:**\n> __**${playlist.title}**__`
				)
			}
		} catch (err) {
			Logger.error(JSON.stringify(err))
			res.status(500).send({ error: "Something went wrong!" })
		}
	})
}
