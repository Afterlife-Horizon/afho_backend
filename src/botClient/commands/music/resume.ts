import { SlashCommandBuilder } from "discord.js"
import unpause from "#/functions/commandUtils/music/unpause"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("resume").setDescription("Resume the audio!"),
        async execute(interaction) {
            const user = interaction.user.username
            const response = await unpause(client, user)

            if (response.status === 200) return interaction.reply({ content: response.message })
            return interaction.reply({
                content: response.error,
                ephemeral: true
            })
        }
    }
}
