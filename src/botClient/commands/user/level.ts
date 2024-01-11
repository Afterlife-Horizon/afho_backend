import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import getLevelFromXp from "#/functions/getLevelFromXp"
import { Logger } from "#/logger/Logger"
require("dotenv").config()

export default (client: BotClient) => {
    return {
        data: new SlashCommandBuilder()
            .setName("level")
            .setDescription("get member's level!")
            .addStringOption(option => option.setName("member").setDescription("member you want to move!").setRequired(true)),
        async execute(interaction) {
            try {
                const messageMember = interaction.options.getString("member")
                const memberid = messageMember.replace(/\D/g, "")

                const member = interaction.author.member
                await client.updateDBUser(member)
                const row = await client.prisma.levels.findUnique({
                    where: {
                        user_id: memberid
                    }
                })

                if (!row)
                    return interaction.reply({
                        content: `❌ Member not found!`
                    })
                const embed = new EmbedBuilder()
                    .setTitle(`Level of ${messageMember}`)
                    .setDescription(`Level: ${getLevelFromXp(row[0].xp)}\nXP: ${row[0].xp}`)
                    .setColor(0x00ae86)
                    .setTimestamp()
                await interaction.reply({ embeds: [embed] })
            } catch (err) {
                Logger.error(err)
                await interaction.reply({ content: `❌ An error occured!` })
            }
        }
    }
}
