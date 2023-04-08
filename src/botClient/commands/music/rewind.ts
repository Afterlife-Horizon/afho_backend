import { GuildMember, SlashCommandBuilder } from "discord.js"
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("rewind")
			.setDescription("rewinds the song for X secs!")
			.addStringOption(option => option.setName("secondes").setDescription("Number of seconds to rewind!").setRequired(true)),
		async execute(interaction) {
			try {
				const guild = interaction.guild
				const member = interaction.member as GuildMember
				if (!guild) return interaction.reply({ content: "👎 **Something went wrong**" }).catch(err => Logger.error(err.message))
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

				const arg = interaction.options.get("secondes")?.value as number
				if (!arg || isNaN(arg))
					return interaction
						.reply({ content: `👎 **You forgot to add the rewinding-time!** Usage: \`/rewind <Time-In-S>\`` })
						.catch(err => Logger.error(err.message))
				if (Math.floor(curPos / 1000 - 1) <= 0)
					return interaction
						.reply({ content: `👎 **There is nothing to rewind, play a song long enough!**` })
						.catch(err => Logger.error(err.message))
				if (Number(arg) < 0 || Number(arg) > Math.floor(curPos / 1000 - 1)) {
					return interaction
						.reply({ content: `👎 **The Rewind-Number-Pos must be between \`0\` and \`${Math.floor(curPos / 1000 - 1)}\`!**` })
						.catch(err => Logger.error(err.message))
				}

				const newPos = curPos - Number(arg) * 1000
				// set Filterschanged to true
				queue.filtersChanged = true
				// seek
				state.subscription.player.stop()
				const resource = client.getResource(queue, queue.tracks[0].id, newPos)
				if (!resource) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))
				state.subscription.player.play(resource)

				interaction
					.reply({ content: `⏪ **Rewinded for \`${arg}s\` to \`${client.formatDuration(newPos)}\`**!` })
					.catch(err => Logger.error(err.message))
			} catch (e: any) {
				console.error(e)
				interaction
					.reply({ content: `❌ Could not join your VC because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` })
					.catch(err => Logger.error(err.message))
			}
		}
	}
}
