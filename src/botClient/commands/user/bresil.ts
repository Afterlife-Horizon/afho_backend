import { Colors, EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import bresil from "#/functions/commandUtils/bresil/bresil"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
require("dotenv").config()

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("bresil")
            .setDescription("Move member to bresil!")
            .addStringOption(option => option.setName("member").setDescription("member you want to move!").setRequired(true)),
        async execute(interaction) {
            try {
                const mover = interaction.member as GuildMember

                const messageMember = interaction.options.get("member")?.value as string
                const memberid = messageMember.replace(/\D/g, "")
                const guild = await interaction.client.guilds.fetch(client.config.serverID)
                const member = await guild?.members.fetch(memberid)
                if (!member)
                    return await interaction.reply({
                        content: "❌ Member not found!"
                    })

                const result = await bresil(client, mover, member)
                if (result.status !== 200)
                    return await interaction.reply({
                        content: `❌ ${result.error}`,
                        ephemeral: true
                    })

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Green)
                            .setAuthor({ name: mover.user.tag })
                            .setDescription(result.message ? result.message : "Bresil moved!")
                            .setTimestamp(new Date())
                    ]
                })
            } catch (err) {
                Logger.error(err)
                await interaction.reply({ content: `❌ An error occured!` })
            }
        }
    }
}
