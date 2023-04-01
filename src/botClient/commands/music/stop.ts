import { SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import musicStop from "../../../functions/commandUtils/music/musicStop"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("stop").setDescription("Stops the audio and clear the queue!"),
		async execute(interaction) {
			const result = musicStop(client, interaction.user.username)

			if (result.status === 200) return await interaction.reply(result.message ? result.message : "👍")
			return await interaction.reply(result.error ? result.error : "👎")
		}
	}
}
