import { SlashCommandBuilder } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import type { ICommand } from "#/types"
require("dotenv").config()

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("levels").setDescription("Get level leaderboard!"),
        async execute(interaction) {
            await interaction.reply({
                content: `${client.config.websiteURL}/levels`
            })
        }
    }
}
