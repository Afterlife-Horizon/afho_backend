import express = require("express")
const router = express.Router()
import { getVoiceConnection } from "@discordjs/voice"
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { GuildMember } from "discord.js"
import BotClient from "../../../botClient/BotClient"

export default function (client) {
	return router.post("/", async (req, res) => {
		try {
			const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
			const connectedMembers = await guild.members.cache.filter(member => member.voice.channel)
			const requester = connectedMembers.filter(member => member.user.username === req.body.user)

			const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0)

			if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!")
			else if (voiceChannel.size !== 0) client.currentChannel = voiceChannel
			else res.status(406).send("You are not connected to a voice channel!")

			if (!client.currentChannel) return res.status(406).send("not connected!")

			const channel = await client.channels.fetch(client.config.baseChannelId)
			let queue = client.queues.get(client.currentChannel.guildId)
			const oldConnection = getVoiceConnection(client.currentChannel.guildId)

			if (!oldConnection) {
				try {
					await client.joinVoiceChannel(client.currentChannel)
				} catch (err) {
					console.log(err)
					res.status(406).send("")
					return await channel.send({ content: `Could not join Voice Channel!` }).catch((err: any) => console.log(err))
				}
			}

			const botsVoiceChanel = guild.channels.cache.find(
				c => c.type === 2 && c.members.filter((m: GuildMember) => m.user.username === "AFHO_bot").size !== 0
			)
			if (botsVoiceChanel?.id !== voiceChannel.id && oldConnection) return res.status(406).send("Not the same channel!")

			const args = req.body.songs.split(" ")
			const track = args.join(" ")

			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
			const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
			const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

			let song: Video | undefined = undefined
			let playList: Playlist | undefined = undefined

			const isYoutube = youtubRegex.exec(track)
			const isYoutubeSong = songRegex.exec(track)
			const isYoutubePlaylist = playlistRegex.exec(track)

			await channel.send({ content: `Searching ${track} ...` })
			if (!oldConnection && queue) {
				client.queues.delete(client.currentChannel.guildId)
				queue = undefined
			}
			if (isYoutube && isYoutubeSong && !isYoutubePlaylist) {
				song = await YouTube.getVideo(track)
			} else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) {
				playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch())
			} else if (isYoutube && isYoutubePlaylist && isYoutubeSong) {
				song = await YouTube.getVideo(track)
				playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch())
			} else {
				song = await YouTube.searchOne(track)
			}
			if (song === null && playList === null) {
				channel.send({ content: `No song were found!` })
				res.status(200).send("no songs found")
				return
			}
			if (!playList) {
				const video = song as Video

				if (!queue || queue.tracks.length == 0) {
					const bitrate = 128
					const newQueue = client.createQueue(video, req.body.user, client.currentChannel.guildId, bitrate)
					client.queues.set(client.currentChannel.guildId, newQueue)
					await client.playSong(client.currentChannel, song)

					res.status(200).send("OK")
					return channel.send({ content: `Now playing : ${video.title} - ${video.durationFormatted}!` })
				}
				queue.tracks.push(client.createSong(video, req.body.user))
				res.status(200).send("OK")
				channel.send({ content: `Added : ${video.title} - ${video.durationFormatted}!` })
			} else {
				song = song ? song : playList.videos[0]

				const video = song as Video
				const index = playList.videos.findIndex(s => s.id == video.id) || 0
				playList.videos.splice(0, index + 1)

				if (!queue || queue.tracks.length == 0) {
					const bitrate = 128
					const newQueue = client.createQueue(song, req.body.user, client.channelId, bitrate)
					playList.videos.forEach(nsong => newQueue.tracks.push(client.createSong(nsong, req.body.user)))
					client.queues.set(client.currentChannel.guildId, newQueue)

					await client.playSong(client.currentChannel, video)

					res.status(200).send("OK")
					return channel.send({ content: `Now playing : ${video.title} - ${video.durationFormatted} - from playlist: ${playList.title}` })
				}

				playList.videos.forEach(nsong => queue.tracks.push(client.createSong(nsong, req.body.user)))

				res.status(200).send("OK")
				return channel.send(
					`Queued at \`${client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${video.title} - \`${
						video.durationFormatted
					}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`
				)
			}
		} catch (err) {
			console.log(err)
			res.status(500).send("OK")
		}
	})
}
