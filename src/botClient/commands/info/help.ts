import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("help").setDescription("Gives a list of my commands!"),
        async execute(interaction) {
            const commands = client.commands
            const minlistnumber = Math.ceil(commands.size / 10)
            const allcommand: ICommand[][] = []
            for (let j = 0; j < minlistnumber; j++) {
                allcommand.push([])
            }

            let i = 0
            commands.forEach(command => {
                allcommand[Math.trunc(i / 10)].push(command)
                i += 1
            })

            let pagenumber = 0

            const buttons = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(new ButtonBuilder().setCustomId("prev").setLabel("⬅ prev").setStyle(ButtonStyle.Primary))
                .addComponents(new ButtonBuilder().setCustomId("next").setLabel("next ➡").setStyle(ButtonStyle.Primary))

            const commandsmsg = await interaction
                .reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Fuchsia)
                            .setTitle(`👍 **Here is a list of my commands**`)
                            .addFields(
                                allcommand[pagenumber].map(command => {
                                    return {
                                        name: `/${command.data.name}`,
                                        value: `> *${command.data.description}*`,
                                        inline: false
                                    }
                                })
                            )
                    ],
                    components: [buttons]
                })
                .catch(err => Logger.error(err.message))

            if (!commandsmsg) return
            const collector1 = commandsmsg.createMessageComponentCollector({
                filter: inn => inn.customId == "next" && inn.user.id == interaction.user.id,
                time: 120000
            })

            collector1.on("collect", async ninteraction => {
                if (pagenumber !== allcommand.length - 1) pagenumber += 1
                await ninteraction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Fuchsia)
                            .setTitle(`👍 **Here is a list of my commands**`)
                            .addFields(
                                allcommand[pagenumber].map(command => {
                                    return {
                                        name: `/${command.data.name}`,
                                        value: `> *${command.data.description}*`,
                                        inline: false
                                    }
                                })
                            )
                    ],
                    components: [buttons]
                })
            })

            const collector2 = commandsmsg.createMessageComponentCollector({
                filter: inn => inn.customId == "prev" && inn.user.id == interaction.user.id,
                time: 120000
            })

            collector2.on("collect", async ninteraction => {
                if (pagenumber !== 0) pagenumber -= 1
                await ninteraction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Fuchsia)
                            .setTitle(`👍 **Here is a list of my commands**`)
                            .addFields(
                                allcommand[pagenumber].map(command => {
                                    return {
                                        name: `/${command.data.name}`,
                                        value: `> *${command.data.description}*`,
                                        inline: false
                                    }
                                })
                            )
                    ],
                    components: [buttons]
                })
            })
        }
    }
}
