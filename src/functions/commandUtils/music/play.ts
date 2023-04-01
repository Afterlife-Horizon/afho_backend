import { getVoiceConnection } from "@discordjs/voice"
import { GuildMember, TextChannel, VoiceChannel } from "discord.js"
import YouTube, { Playlist, Video } from "youtube-sr"
import BotClient from "../../../botClient/BotClient"
import { IQueue } from "../../../types"

export default async function play(client: BotClient, user: string, songs: string) {
	const guild = client.guilds.cache.find(g => g.name === client.config.serverName)
	const connectedMembers = guild?.members.cache.filter(member => member.voice.channel)
	const requester = connectedMembers?.find(member => member.user.username === user)

	if (!guild) return { status: 406, error: "Guild not found!" }
	if (!requester) return { status: 406, error: "Could not find you in the guild!" }

	const voiceChannel = guild.channels.cache.find(
		c => c.type === 2 && c.members.find(m => m.user.username === requester.user.username) !== undefined
	) as VoiceChannel

	if (!voiceChannel) return { status: 406, error: "You are not connected to a voice channel!" }
	client.currentChannel = voiceChannel

	const channel = (await client.channels.fetch(client.config.baseChannelId)) as TextChannel
	if (!channel) return { status: 406, error: "Could not find the base channel!" }

	let queue = client.queues.get(client.currentChannel.guildId)
	const oldConnection = getVoiceConnection(client.currentChannel.guildId)

	if (!oldConnection) {
		try {
			await client.joinVoiceChannel(client.currentChannel)
		} catch (err) {
			console.log(err)
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
			const newQueue = client.createQueue(song, requester.user, client.config.baseChannelId, bitrate)
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
}
