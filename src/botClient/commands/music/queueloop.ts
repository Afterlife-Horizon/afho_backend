import { GuildMember, SlashCommandBuilder } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../../../logger/Logger"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("queueloop").setDescription("Toggles the Queue-Loop!"),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(guild.id)
			if (!queue) {
				return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
			}
			if (queue.trackloop) queue.trackloop = false

			queue.queueloop = !queue.queueloop

			return interaction
				.reply(`🔂 **Queue-Loop is now \`${queue.queueloop ? "Enabled" : "Disabled"}\`**`)
				.catch(err => Logger.error(err.message))
		}
	}
}
