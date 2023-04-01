import { SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import skip from "../../../functions/commandUtils/music/skip"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("skip").setDescription("skips the song!"),
		async execute(interaction) {
			const user = interaction.member?.user.username

			if (!user) return interaction.reply("👎 **Something went wrong**").catch(err => console.log(err))

			const response = skip(client, user)

			if (response.error) return interaction.reply({ content: response.error, ephemeral: true })
			return interaction.reply(response.message ? response.message : "👍").catch(err => console.log(err))
		}
	}
}
