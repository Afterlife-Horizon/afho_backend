import { SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import disconnect from "../../../functions/commandUtils/music/disconnect"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("leave").setDescription("Leaves the voice channel!"),
		async execute(interaction) {
			const res = await disconnect(client)

			if (res.status === 200) {
				await interaction.reply({ content: "👋 **Disconnected**", ephemeral: true })
			}
			await interaction.reply({ content: res.error, ephemeral: true })
		}
	}
}
