import { SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
require("dotenv").config()

export default (_: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("brasilboard").setDescription("Get brasil leaderboard!"),
		async execute(interaction) {
			await interaction.reply({ content: "https://music.afterlifehorizon.net/brasilboard" })
		}
	}
}
