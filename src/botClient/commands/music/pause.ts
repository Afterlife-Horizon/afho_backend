import { GuildMember, SlashCommandBuilder } from "discord.js"
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import pause from "../../../functions/commandUtils/music/pause"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("pause").setDescription("pause the audio!"),
		async execute(interaction) {
			const user = interaction.user.username
			const response = pause(client, user)

			if (response.status === 200) return interaction.reply({ content: response.message })
			return interaction.reply({ content: response.error, ephemeral: true })
		}
	}
}
