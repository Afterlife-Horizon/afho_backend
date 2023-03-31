import { GuildMember, SlashCommandBuilder } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("trackloop").setDescription("Toggles the Track-Loop!"),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => console.log(err))

			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => console.log(err))
			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => console.log(err))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => console.log(err))

			const queue = client.queues.get(guild.id)
			if (!queue) return interaction.reply(`👎 **Nothing playing right now**`).catch(err => console.log(err))

			if (queue.queueloop) queue.queueloop = false

			queue.trackloop = !queue.trackloop

			return interaction.reply(`🔁 **Track-Loop is now \`${queue.trackloop ? "Enabled" : "Disabled"}\`**`).catch(err => console.log(err))
		}
	}
}
