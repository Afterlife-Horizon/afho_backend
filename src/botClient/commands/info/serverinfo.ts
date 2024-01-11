import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (_: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("serverinfo").setDescription("Gives information about the current server!"),
        async execute(interaction) {
            const member = interaction.member as GuildMember
            const guild = interaction.guild

            if (!member || !guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
            const serverinfo = new EmbedBuilder()
                .setTitle("Server Info")
                .setDescription("Displaying information about the current server!")
                .addFields({ name: "Server name", value: `${guild.name}` }, { name: "Total members", value: `${guild.memberCount}` })

            await interaction.reply({ embeds: [serverinfo] })
        }
    }
}
