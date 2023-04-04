import { GuildMember, SlashCommandBuilder } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import shuffle from "../../../functions/commandUtils/music/shuffle"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("shuffle").setDescription("shuffles the queue!"),
		async execute(interaction) {
			const user = interaction.member?.user.username

			if (!user) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))

			const response = shuffle(client, user)

			if (response.error) return interaction.reply({ content: response.error, ephemeral: true })

			return interaction.reply(response.message ? response.message : "👍").catch(err => Logger.error(err.message))
		}
	}
}
