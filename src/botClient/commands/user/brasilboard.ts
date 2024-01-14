import { SlashCommandBuilder } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import type { ICommand } from "#/types"
require("dotenv").config()

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("brasilboard").setDescription("Get brasil leaderboard!"),
        async execute(interaction) {
            await interaction.reply({
                content: `${client.config.websiteURL}`
            })
        }
    }
}
