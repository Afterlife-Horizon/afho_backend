import { GuildMember, SlashCommandBuilder } from "discord.js"
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("pause").setDescription("pause the audio!"),
		async execute(interaction) {
			try {
				const member = interaction.member as GuildMember
				const guild = interaction.guild
				if (!member || !guild) return interaction.reply("👎 **Something went wrong**")
				if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**")

				const oldConnection = getVoiceConnection(guild.id)
				if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**")
				if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
					return interaction.reply("👎 **We are not in the same Voice-Channel**!")

				const queue = client.queues.get(guild.id)
				if (!queue) {
					return interaction.reply(`👎 **Nothing playing right now**`)
				}

				if (queue.paused) return interaction.reply(`👎 **Track already paused**`)

				queue.paused = true

				const state = oldConnection.state as VoiceConnectionReadyState
				if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => console.log(err))

				state.subscription.player.pause()

				return interaction.reply(`⏸️ **Successfully paused the Track**`)
			} catch (err) {
				console.log(err)
			}
		}
	}
}
