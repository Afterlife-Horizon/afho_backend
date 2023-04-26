import { SlashCommandBuilder } from "discord.js"
import type { ICommand } from "../../../types"
import type BotClient from "../../../botClient/BotClient"
require("dotenv").config()

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("brasilboard").setDescription("Get brasil leaderboard!"),
		async execute(interaction) {
			await interaction.reply({ content: `${client.config.websiteURL}/brasilboard` })
		}
	}
}
