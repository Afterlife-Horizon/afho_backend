/* eslint-disable no-useless-escape */
import { GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { ICommand, IQueue } from "../../../types"
import BotClient from "../../BotClient"

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
				if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => console.log(err))
				if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => console.log(err))

				const oldConnection = getVoiceConnection(guild.id)
				if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) {
					return await interaction.reply({ content: `We are not in the same channel: I'm in <#${oldConnection.joinConfig.channelId}>!` })
				}

				client.currentChannel = member.voice.channel as VoiceChannel

				if (!client.currentChannel) return interaction.reply({ content: `👎 **Something went wrong**` }).catch(err => console.log(err))
				const track = interaction.options.get("song")?.value as string
				const args = track.split(" ")

				if (!args[0]) return interaction.reply(`Please add the wished music via /play <name/link>`)

				const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
				const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
				const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

				let song: Video | undefined = undefined
				let playList: Playlist | undefined = undefined

				const isYoutube = youtubRegex.exec(track)
				const isYoutubeSong = songRegex.exec(track)
				const isYoutubePlaylist = playlistRegex.exec(track)

				if (!oldConnection) {
					try {
						await client.joinVoiceChannel(client.currentChannel)
					} catch (err) {
						console.log(err)
						return await interaction.reply({ content: `Could not join Voice Channel!` }).catch(err => console.log(err))
					}
				}

				await interaction.reply({ content: `Searching ${track} ...` })
				let queue: IQueue | undefined = client.queues.get(guild.id)
				if (!oldConnection && queue) {
					client.queues.delete(guild.id)
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
							.catch(err => console.log(err))
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
							.catch(err => console.log(err))
					}

					playList.videos.forEach(nsong => (queue ? queue.tracks.push(client.createSong(nsong, interaction.user)) : null))

					return interaction
						.editReply(
							`Queued at \`${client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${video.title} - \`${
								video.durationFormatted
							}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`
						)
						.catch(err => console.log(err))
				}
			} catch (err) {
				console.log(err)
				return
			}
		}
	}
}
