/* eslint-disable no-useless-escape */
import { GuildMember, SlashCommandBuilder } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { Playlist, Video, default as YouTube } from "youtube-sr"
import { Logger } from "../../../logger/Logger"
import type { ICommand } from "../../../types"
import type { IESong } from "../../../types/music"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("playtop")
			.setDescription("Plays Music in your Voice Channel and positions it to the queue top")
			.addStringOption(option => option.setName("song").setDescription("Enter a youtube link or a song name!").setRequired(true)),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			// get an old connection
			const oldConnection = getVoiceConnection(guild.id)
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))
			const queue = client.queues.get(guild.id)
			if (!queue) {
				return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
			}
			const track = interaction.options.get("song")?.value as string
			if (!track)
				return interaction.reply(`👎 Please add the wished Music via: \`/playtop <Name/Link>\``).catch(err => Logger.error(err.message))

			const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
			const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
			const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

			let song: Video | undefined = undefined
			let playlist: Playlist | undefined = undefined

			const isYT = youtubRegex.exec(track)
			const isSong = songRegex.exec(track)
			const isList = playlistRegex.exec(track)

			try {
				await interaction.reply(`🔍 *Searching **${track}** ...*`).catch(err => Logger.error(err.message))

				if (isYT && isSong && !isList) {
					song = await YouTube.getVideo(track)
				} else if (isYT && !isSong && isList) {
					playlist = await YouTube.getPlaylist(track).then(p => p.fetch())
				} else if (isYT && isSong && isList) {
					song = await YouTube.getVideo(`https://www.youtube.com/watch?v=${isSong[2]}`)
					playlist = await YouTube.getPlaylist(`https://www.youtube.com/playlist?list=${isList[2]}`).then(p => p.fetch())
				} else {
					song = await YouTube.searchOne(track)
				}

				if (!song && !playlist) {
					return interaction.editReply(`❌ **Failed looking up for ${track}!**`)
				} else if (!playlist) {
					const video = song as Video

					queue.tracks = [queue.tracks[0], client.createSong(video, interaction.user), ...queue.tracks.slice(1)]

					return interaction
						.editReply(`▶️ **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\``)
						.catch(err => Logger.error(err.message))
				} else {
					song = song ? song : playlist.videos[0]

					const video = song as Video

					const index = playlist.videos.findIndex(s => s.id == video.id) || 0
					playlist.videos.splice(index, 1)

					const playlistSongs: IESong[] = []
					playlist.videos.forEach(nsong => playlistSongs.push(client.createSong(nsong, interaction.user)))
					queue.tracks = [queue.tracks[0], client.createSong(video, interaction.user), ...playlistSongs, ...queue.tracks.slice(1)]

					return interaction
						.editReply(
							`👍 **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\`\n> **Added \`${
								playlist.videos.length - 1
							} Songs\` from the Playlist:**\n> __**${playlist.title}**__`
						)
						.catch(err => Logger.error(err.message))
				}
			} catch (err: any) {
				Logger.error(JSON.stringify(err))
				return interaction
					.reply(`❌ Could not play the Song because: \`\`\`${err.message || err}`.substring(0, 1950) + `\`\`\``)
					.catch(err => Logger.error(err.message))
			}
		}
	}
}
