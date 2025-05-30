import {
    ActionRowBuilder,
    Colors,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextChannel
} from "discord.js"
import changeFilters from "#/functions/commandUtils/music/filters"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder().setName("filters").setDescription("Set filters!"),
        async execute(interaction) {
            const member = interaction.member as GuildMember
            const guild = await client.guilds.fetch(member.guild.id)
            const channel = (await client.channels.fetch(client.config.baseChannelID)) as TextChannel

            if (!guild || !channel)
                return await interaction.reply({
                    content: `👎 **Something went wrong**`,
                    ephemeral: true
                })

            const queue = client.musicHandler.queues.get(guild.id)
            if (!queue) return await interaction.reply({ content: `👎 **I'm nothing playing right now.**` }).catch(console.error)

            const options = Object.keys(queue.effects)

            const Menu = new StringSelectMenuBuilder()
                .setCustomId("filter_changing")
                .setPlaceholder("Pic Filters to enable/disable")
                .setMaxValues(options.filter(o => o != "bassboost" && o != "speed").length)
                .addOptions(
                    options
                        .filter(o => o != "bassboost" && o != "speed")
                        .map(option => {
                            return {
                                label: `${option.charAt(0).toUpperCase()}${option.slice(1)}`,
                                value: option,
                                description: `${queue.effects[option] ? `Enabled: ` : `Disabled: `} A ${option}-ish Audio-Effect`,
                                emoji: queue.effects[option] ? `✅` : "❌"
                            }
                        })
                )

            const msg = await channel
                .send({
                    content: "🔗 Pick what filter(s) you want to change!",
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(Menu)]
                })
                .catch(console.error)
            if (!msg) return { status: 500, error: `👎 **Something went wrong**` }

            const collector = msg.createMessageComponentCollector({
                filter: i => i.isStringSelectMenu() && i.customId == "filter_changing" && i.user.id == member.user.id,
                time: 60_000,
                max: 1
            })

            collector.on("collect", async (selectMenu: StringSelectMenuInteraction) => {
                selectMenu.values.forEach(option => (queue.effects[option] = !queue.effects[option]))
                selectMenu.reply({
                    content: `Changed ${selectMenu.values.length} Filter(s) to:\n> *Will be applied with the next Skip*`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Fuchsia)
                            .setTitle("Current Filters")
                            .setDescription(
                                Object.keys(queue.effects)
                                    .filter(option => option != "bassboost" && option != "speed")
                                    .map(
                                        option =>
                                            `> **\`${option.charAt(0).toUpperCase()}${option.slice(1)}\`** - ${
                                                queue.effects[option] ? `✅ Enabled` : `❌ Disabled:`
                                            }`
                                    )
                                    .join("\n\n")
                            )
                    ]
                })

                const res = await changeFilters(client, { member: member })
                if (res.error)
                    interaction.reply({
                        content: res.error,
                        ephemeral: true
                    })
            })

            collector.on("end", () => {
                Menu.setDisabled(true)
                msg.edit({
                    content: msg.content,
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(Menu)]
                }).catch(err => Logger.error(err.message))
            })
        }
    }
}
