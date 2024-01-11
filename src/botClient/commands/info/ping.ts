import { SlashCommandBuilder } from "discord.js"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (_: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
        async execute(interaction) {
            await interaction.reply(`Pong! My ping is ${interaction.client.ws.ping}`).catch(err => Logger.error(err.message))
        }
    }
}
