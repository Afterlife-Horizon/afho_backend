import { getVoiceConnection } from "@discordjs/voice"
import { GuildMember, TextChannel, VoiceChannel } from "discord.js"
import YouTube, { Playlist, Video } from "youtube-sr"
import BotClient from "../../../botClient/BotClient"
import { IQueue } from "../../../types"
import { Logger } from "../../../logger/Logger"
import getSongNameFromSpotify from "../../getInfoFromSpotify"
import getPlaylistInfoFromSpotify from "../../getPlaylistInfoFromSpotify"

export default async function play(client: BotClient, user: string, songs: string) {
	try {
		const guild = await client.guilds.fetch(client.config.serverID)
		await guild?.members.fetch()
		const connectedMembers = guild?.members.cache.filter(member => member.voice.channel)
		const requester = connectedMembers?.find(member => member.user.username === user)

		if (!guild) return { status: 406, error: "Guild not found!" }
		if (!requester) return { status: 406, error: "You are not connected to a voice channel!" }

		const voiceChannel = guild.channels.cache.find(
			c => c.type === 2 && c.members.find(m => m.user.username === requester.user.username) !== undefined
		) as VoiceChannel

		if (!voiceChannel) return { status: 406, error: "You are not connected to a voice channel!" }
		client.currentChannel = voiceChannel

		const channel = (await client.channels.fetch(client.config.baseChannelID)) as TextChannel
		if (!channel) return { status: 406, error: "Could not find the base channel!" }

		let queue = client.queues.get(client.currentChannel.guildId)
		const oldConnection = getVoiceConnection(client.currentChannel.guildId)

		if (!oldConnection) {
			try {
				await client.joinVoiceChannel(client.currentChannel)
			} catch (err) {
				if (err instanceof Error) Logger.error(err.message)
				return { status: 406, error: `Could not join Voice Channel!` }
			}
		}

		const botsVoiceChanel = guild.channels.cache.find(
			c => c.type === 2 && c.members.find((m: GuildMember) => m.user.username === client.user?.username) !== undefined
		)
		if (botsVoiceChanel?.id !== voiceChannel.id && oldConnection) return { status: 406, error: "Not the same channel!" }

		const args = songs.split(" ")
		const track = args.join(" ")

		const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
		const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
		const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

		const spotifyRegex = /^.*(open\.spotify\.com)\/.+$/gi
		const spotifySongRegex = /^(https:\/\/open.spotify.com\/(track\/))(.*)$.*/gi
		const spotifyPlaylistRegex = /^https:\/\/open.spotify.com\/user\/spotify\/playlist\/([a-zA-Z0-9]+)(.*)$.*/gi

		let song: Video | undefined = undefined
		let playList: Playlist | undefined = undefined

		const isYoutube = youtubRegex.exec(track)
		const isYoutubeSong = songRegex.exec(track)
		const isYoutubePlaylist = playlistRegex.exec(track)

		const isSpotify = spotifyRegex.exec(track)
		const isSpotifySong = spotifySongRegex.exec(track)
		const isSpotifyPlaylist = spotifyPlaylistRegex.exec(track)

		await channel.send({ content: `Searching ${track} ...` })
		if (!oldConnection && queue) {
			client.queues.delete(client.currentChannel.guildId)
			queue = undefined
		}

		if (!isYoutube && !isSpotify) {
			return { status: 406, error: `Please enter a valid youtube or spotify link!` }
		}

		if (isYoutube) {
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
		} else if (isSpotify) {
			if (isSpotifySong && !isSpotifyPlaylist) {
				const spotifyInfo = await getSongNameFromSpotify(client, track)
				song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
			} else if (isSpotifyPlaylist && !isSpotifySong) {
				const playlistInfo = await getPlaylistInfoFromSpotify(client, track)
				console.log(playlistInfo)
				for (const song of playlistInfo.items) {
					const video = await YouTube.searchOne(`${song.track.artists[0].name} - ${song.track.name}`)
					if (video) {
						if (!playList) playList = new Playlist({ title: playlistInfo.name, url: track, videos: [] })
						playList.videos.push(video)
					}
				}
				return { status: 406, error: `Spotify playlists are not supported yet!` }
			} else if (isSpotifyPlaylist && isSpotifySong) {
				const spotifyInfo = await getSongNameFromSpotify(client, track)
				song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
			} else {
				const spotifyInfo = await getSongNameFromSpotify(client, track)
				song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
			}
		}

		if (song === null && playList === null) {
			channel.send({ content: `No song were found!` })
			return { status: 400, error: "no songs found" }
		}
		if (!playList) {
			const video = song as Video

			if (!queue || queue.tracks.length == 0) {
				const bitrate = 128
				const newQueue = client.createQueue(video, requester.user, client.currentChannel.guildId, bitrate)
				client.queues.set(client.currentChannel.guildId, newQueue)
				await client.playSong(client.currentChannel, video)

				channel.send({ content: `Now playing : ${video.title} - ${video.durationFormatted}!` })
				return { status: 200, message: "OK" }
			}
			queue.tracks.push(client.createSong(video, requester.user))
			channel.send({ content: `Added : ${video.title} - ${video.durationFormatted}!` })
			return { status: 200, message: "OK" }
		} else {
			song = song ? song : playList.videos[0]

			const video = song as Video
			const index = playList.videos.findIndex(s => s.id == video.id) || 0
			playList.videos.splice(0, index + 1)

			if (!queue || queue.tracks.length == 0) {
				const bitrate = 128
				const newQueue = client.createQueue(song, requester.user, client.config.baseChannelID, bitrate)
				playList.videos.forEach(nsong => newQueue.tracks.push(client.createSong(nsong, requester.user)))
				client.queues.set(client.currentChannel.guildId, newQueue)

				await client.playSong(client.currentChannel, video)

				channel.send({ content: `Now playing : ${video.title} - ${video.durationFormatted} - from playlist: ${playList.title}` })
				return { status: 200, message: "OK" }
			}

			queue = client.queues.get(client.currentChannel.guildId) as IQueue

			playList.videos.forEach(nsong => queue?.tracks.push(client.createSong(nsong, requester.user)))

			channel.send(
				`Queued at \`${client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${video.title} - \`${
					video.durationFormatted
				}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`
			)
			return { status: 200, message: "OK" }
		}
	} catch (err) {
		if (err instanceof Error) Logger.error(err.message)
		return { status: 406, error: `Could not play song!` }
	}
}
