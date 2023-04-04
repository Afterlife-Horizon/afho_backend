import { GuildMember, SlashCommandBuilder } from "discord.js"
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("skipto")
			.setDescription("skips to the song number you choose in the queue!")
			.addStringOption(option =>
				option.setName("tracknumber").setDescription("Number of the track you want to skip to in the queue!").setRequired(true)
			),
		async execute(interaction) {
			const guild = interaction.guild
			const member = interaction.member as GuildMember

			if (!member || !guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))

			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(guild.id)
			if (!queue) {
				return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
			}

			if (!queue.tracks || queue.tracks.length <= 1) {
				return interaction.reply(`👎 **Nothing to skip**`).catch(err => Logger.error(err.message))
			}

			const arg = interaction.options.get("tracknumber")?.value as number
			if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length)
				return interaction.reply({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't skip to ${arg}th Song.**` })

			queue.skipped = true

			if (queue.queueloop) {
				for (let i = 1; i <= arg - 1; i++) {
					queue.tracks.push(queue.tracks[i])
				}
			}
			queue.tracks = queue.tracks.slice(arg - 1)

			const state = oldConnection.state as VoiceConnectionReadyState
			if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

			state.subscription.player.stop()

			return interaction.reply(`⏭️ **Successfully skipped ${arg} Track(s)**`).catch(err => Logger.error(err.message))
		}
	}
}
