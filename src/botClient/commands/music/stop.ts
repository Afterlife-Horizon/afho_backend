import { SlashCommandBuilder } from "discord.js"
import musicStop from "../../../functions/commandUtils/music/musicStop"
import type { ICommand } from "../../../types"
import type BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("stop").setDescription("Stops the audio and clear the queue!"),
		async execute(interaction) {
			const result = await musicStop(client, interaction.user.username)

			if (result.status === 200) return await interaction.reply(result.message ? result.message : "👍")
			return await interaction.reply(result.error ? result.error : "👎")
		}
	}
}
