/* eslint-disable no-useless-escape */
import { GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { ICommand, IQueue } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("play")
			.setDescription("Plays a youtube video/song!")
			.addStringOption(option => option.setName("song").setDescription("Enter a song or a playlist!").setRequired(true)),
		async execute(interaction) {
			try {
				const member = interaction.member as GuildMember
				const guild = interaction.guild
				if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
				if (!member.voice.channelId)
					return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

				const oldConnection = getVoiceConnection(guild.id)
				if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) {
					return await interaction.reply({ content: `We are not in the same channel: I'm in <#${oldConnection.joinConfig.channelId}>!` })
				}

				client.currentChannel = member.voice.channel as VoiceChannel

				if (!client.currentChannel)
					return interaction.reply({ content: `👎 **Something went wrong**` }).catch(err => Logger.error(err.message))
				const track = interaction.options.get("song")?.value as string
				const args = track.split(" ")

				if (!args[0]) return interaction.reply(`Please add the wished music via /play <name/link>`)

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

				if (!oldConnection) {
					try {
						await client.joinVoiceChannel(client.currentChannel)
					} catch (err) {
						if (err instanceof Error) Logger.error(err.message)
						return await interaction.reply({ content: `Could not join Voice Channel!` }).catch(err => Logger.error(err.message))
					}
				}

				await interaction.reply({ content: `Searching ${track} ...` })
				let queue: IQueue | undefined = client.queues.get(guild.id)
				if (!oldConnection && queue) {
					client.queues.delete(guild.id)
					queue = undefined
				}

				if (!isYoutube && !isSpotify) {
					return interaction.editReply({ content: `Please enter a valid youtube or spotify link!` })
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
						getSongNameFromSpotify(client, track)
						song = await YouTube.searchOne(track)
					} else if (isSpotifyPlaylist && !isSpotifySong)
						return interaction.editReply({ content: `Spotify playlists are not supported yet!` })
					else if (isSpotifyPlaylist && isSpotifySong) {
						getSongNameFromSpotify(client, track)
						song = await YouTube.searchOne(track)
					} else {
						getSongNameFromSpotify(client, track)
						song = await YouTube.searchOne(track)
					}
				}

				console.log(song)

				if (song === null && playList === null) {
					interaction.editReply({ content: `No song were found!` })
					return
				}
				if (!playList) {
					const video = song as Video

					if (!queue || queue.tracks.length == 0) {
						const bitrate = 128
						const newQueue = client.createQueue(video, interaction.user, interaction.channelId, bitrate)
						client.queues.set(guild.id, newQueue)
						await client.playSong(client.currentChannel, video)

						return interaction
							.editReply({ content: `Now playing : ${video.title} - ${video.durationFormatted}!` })
							.catch(err => Logger.error(err.message))
					}
					queue.tracks.push(client.createSong(video, interaction.user))
				} else {
					song = song ? song : playList.videos[0]

					const video = song as Video
					const index = playList.videos.findIndex(s => s.id == video.id) || 0
					playList.videos.splice(0, index + 1)

					if (!queue || queue.tracks.length == 0) {
						const bitrate = 128
						const newQueue = client.createQueue(video, interaction.user, interaction.channelId, bitrate)
						playList.videos.forEach(nsong => newQueue.tracks.push(client.createSong(nsong, interaction.user)))
						client.queues.set(guild.id, newQueue)

						await client.playSong(client.currentChannel, video)

						return interaction
							.editReply({ content: `Now playing : ${video.title} - ${video.durationFormatted} - from playlist: ${playList.title}` })
							.catch(err => Logger.error(err.message))
					}

					playList.videos.forEach(nsong => (queue ? queue.tracks.push(client.createSong(nsong, interaction.user)) : null))

					return interaction
						.editReply(
							`Queued at \`${client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${video.title} - \`${
								video.durationFormatted
							}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`
						)
						.catch(err => Logger.error(err.message))
				}
			} catch (err) {
				if (err instanceof Error) Logger.error(err.message)
				return
			}
		}
	}
}
async function getSongNameFromSpotify(client: BotClient, track: string) {
	const id = track.split("/").pop()
	console.log(id)
	const access_token = await client.getSpotifyToken()
	const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	})
	const data = await res.json()
	return data.name
}
