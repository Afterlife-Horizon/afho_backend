import { GuildMember, SlashCommandBuilder } from "discord.js"
import clearQueue from "#/functions/commandUtils/music/clearqueue"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("clearqueue").setDescription("clear the queue!"),
        async execute(interaction) {
            const member = interaction.member as GuildMember
            if (!member) return interaction.reply(`👎 **Something went wrong**`)

            const res = await clearQueue(client, { member })

            if (res.error) return interaction.reply(res.error)

            return interaction.reply(res.message ? res.message : `👎 **Something went wrong**`)
        }
    }
}
