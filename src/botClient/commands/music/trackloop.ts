import { GuildMember, SlashCommandBuilder } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../../../logger/Logger"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("trackloop").setDescription("Toggles the Track-Loop!"),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(guild.id)
			if (!queue) return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))

			if (queue.queueloop) queue.queueloop = false

			queue.trackloop = !queue.trackloop

			return interaction
				.reply(`🔁 **Track-Loop is now \`${queue.trackloop ? "Enabled" : "Disabled"}\`**`)
				.catch(err => Logger.error(err.message))
		}
	}
}
