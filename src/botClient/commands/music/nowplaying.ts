import { SlashCommandBuilder, EmbedBuilder, GuildMember, Colors } from "discord.js"
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../../../logger/Logger"
import type { IQueue } from "../../../types/music"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("nowplaying").setDescription("Shows information about the current song!"),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(interaction.guild.id) as IQueue
			if (!queue || !queue.tracks || !queue.tracks[0]) {
				return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
			}
			const song = queue.tracks[0]
			if (!song) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

			const state = oldConnection.state as VoiceConnectionReadyState
			if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))
			const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState
			if (!playerState || !playerState.resource || !playerState.resource.volume)
				return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

			const curPos = playerState.resource.playbackDuration

			const songEmbed = new EmbedBuilder()
				.setColor(Colors.Fuchsia)
				.setTitle(`${song.title}`)
				.setURL(client.getYTLink(song.id as string))
				.addFields(
					{
						name: `ℹ️ **Upload-Channel:**`,
						value: `> ${song ? `[${song.channel?.name}](${song.channel?.url})` : `\`Unknown\``}`,
						inline: true
					},
					{ name: `📅 **Upload-At:**`, value: `> ${song.uploadedAt}`, inline: true },
					{ name: `💯 **Requester:**`, value: `> ${song.requester} \`${song.requester.tag}\``, inline: true },
					{
						name: `⏳ **Duration:**`,
						value: `> ${client.createBar(song.duration, curPos)}\n> **${client.formatDuration(curPos)} / ${song.durationFormatted}**`
					}
				)
			if (song?.thumbnail?.url) songEmbed.setImage(`${song?.thumbnail?.url}`)

			return interaction.reply({ content: `ℹ️ **Nowplaying Track**`, embeds: [songEmbed] }).catch(err => Logger.error(err.message))
		}
	}
}
