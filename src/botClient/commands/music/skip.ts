import { SlashCommandBuilder } from "discord.js"
import skip from "#/functions/commandUtils/music/skip"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("skip").setDescription("skips the song!"),
        async execute(interaction) {
            const user = interaction.member?.user.username

            if (!user) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))

            const response = await skip(client, user)

            if (response.error)
                return interaction.reply({
                    content: response.error,
                    ephemeral: true
                })
            return interaction.reply(response.message ? response.message : "👍").catch(err => Logger.error(err.message))
        }
    }
}
