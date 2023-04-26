import { GuildMember, SlashCommandBuilder } from "discord.js"
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../../../logger/Logger"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("forward")
			.setDescription("Forwards for X (secs)!")
			.addStringOption(option => option.setName("seconds").setDescription("From -20 to +20!").setRequired(true)),
		async execute(interaction) {
			try {
				const member = interaction.member as GuildMember
				const guild = interaction.guild

				if (!member || !guild) return await interaction.reply({ content: `Something went wrong` })
				if (!member.voice.channelId)
					return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch(err => Logger.error(err.message))

				const oldConnection = getVoiceConnection(guild.id)
				if (!oldConnection)
					return interaction.reply({ content: "👎 **I'm not connected somewhere!**" }).catch(err => Logger.error(err.message))
				if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
					return interaction.reply({ content: "👎 **We are not in the same Voice-Channel**!" }).catch(err => Logger.error(err.message))

				const queue = client.queues.get(guild.id)
				if (!queue || !queue.tracks || !queue.tracks[0]) {
					return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
				}

				const state = oldConnection.state as VoiceConnectionReadyState
				if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

				const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState
				if (!playerState || !playerState.resource || !playerState.resource.volume)
					return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

				const curPos = playerState.resource.playbackDuration

				const arg = interaction.options.get("seconds")?.value as number

				if (!arg || isNaN(arg))
					return interaction
						.reply({ content: `👎 **You forgot to add the forwarding-time!** Usage: \`/forward <Time-In-S>\`` })
						.catch(err => Logger.error(err.message))

				if (Number(arg) < 0 || Number(arg) > Math.floor((queue.tracks[0].duration - curPos) / 1000 - 1)) {
					return interaction
						.reply({
							content: `👎 **The Forward-Number-Pos must be between \`0\` and \`${Math.floor(
								(queue.tracks[0].duration - curPos) / 1000 - 1
							)}\`!**`
						})
						.catch(err => Logger.error(err.message))
				}
				const newPos = curPos + Number(arg) * 1000
				queue.filtersChanged = true
				state.subscription.player.stop()
				const ressource = client.getResource(queue, queue.tracks[0].id, newPos)
				if (!ressource) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))
				state.subscription.player.play(ressource)

				interaction
					.reply({ content: `⏩ **Forwarded for \`${arg}s\` to \`${client.formatDuration(newPos)}\`**!` })
					.catch(err => Logger.error(err.message))
			} catch (e: any) {
				Logger.error(JSON.stringify(e))
				interaction
					.reply({ content: `❌ Could not join your VC because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` })
					.catch(err => Logger.error(err.message))
			}
		}
	}
}
