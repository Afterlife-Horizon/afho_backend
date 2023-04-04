import { SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (_: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
		async execute(interaction) {
			await interaction.reply(`Pong! My ping is ${interaction.client.ws.ping}`).catch(err => Logger.error(err.message))
		}
	}
}
