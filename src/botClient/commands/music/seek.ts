import { GuildMember, SlashCommandBuilder } from "discord.js"
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../../../logger/Logger"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("seek")
			.setDescription("Seeks to a specific Position (secs)!")
			.addStringOption(option => option.setName("secondes").setDescription("Number of seconds to seek to!").setRequired(true)),
		async execute(interaction) {
			try {
				const member = interaction.member as GuildMember
				const guild = interaction.guild
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

				const arg = interaction.options.get("secondes")?.value as number
				if (!arg || isNaN(arg))
					return interaction
						.reply({ content: `👎 **You forgot to add the seeking-time!** Usage: \`/seek <Time-In-S>\`` })
						.catch(err => Logger.error(err.message))

				if (Number(arg) < 0 || Number(arg) > Math.floor(queue.tracks[0].duration / 1000 - 1)) {
					return interaction
						.reply({
							content: `👎 **The Seek-Number-Pos must be between \`0\` and \`${Math.floor(queue.tracks[0].duration / 1000 - 1)}\`!**`
						})
						.catch(err => Logger.error(err.message))
				}

				const newPos = Number(arg) * 1000
				queue.filtersChanged = true

				const state = oldConnection.state as VoiceConnectionReadyState
				if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

				state.subscription.player.stop()
				const resource = client.getResource(queue, queue.tracks[0].id, newPos)
				if (!resource) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))
				state.subscription.player.play(resource)

				interaction.reply({ content: `⏩ **Seeked to \`${client.formatDuration(newPos)}\`**!` }).catch(err => Logger.error(err.message))
			} catch (e: any) {
				Logger.error(JSON.stringify(e))
				interaction
					.reply({ content: `❌ Could not join your VC because: \`\`\`${e.interaction || e}`.substring(0, 1950) + `\`\`\`` })
					.catch(err => Logger.error(err.message))
			}
		}
	}
}
