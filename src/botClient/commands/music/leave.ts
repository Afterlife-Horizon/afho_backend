import { SlashCommandBuilder } from "discord.js"
import disconnect from "#/functions/commandUtils/music/disconnect"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("leave").setDescription("Leaves the voice channel!"),
        async execute(interaction) {
            const res = await disconnect(client)

            if (res.status === 200) {
                await interaction.reply({ content: "👋 **Disconnected**" })
            }
            await interaction.reply({ content: res.error, ephemeral: true })
        }
    }
}
