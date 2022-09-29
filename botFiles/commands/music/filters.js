const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filters')
        .setDescription('Set filters!'),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch(() => null);
            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (!oldConnection) return interaction.reply({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);

            const queue = interaction.client.queues.get(interaction.guild.id);
            if (!queue) return interaction.reply({ content: `👎 **I'm nothing playing right now.**` }).catch(() => null);

            const options = Object.keys(queue.effects);

            const Menu = new SelectMenuBuilder()
                .setCustomId("filter_changing")
                .setPlaceholder("Pic Filters to enable/disable")
                .setMaxValues(options.filter(o => o != "bassboost" && o != "speed").length)
                .addOptions(options.filter(o => o != "bassboost" && o != "speed").map(option => {
                    return {
                        label: `${option.charAt(0).toUpperCase()}${option.slice(1)}`,
                        value: option,
                        description: `${queue.effects[option] ? `Enabled: ` : `Disabled: `} A ${option}-ish Audio-Effect`,
                        emoji: queue.effects[option] ? `✅` : "❌",
                    };
                }));
            const msg = await interaction.channel.send({
                content: "🔗 Pick what filter(s) you want to change!",
                components: [new ActionRowBuilder().addComponents(Menu)],
            }).catch(console.error);
            if (!msg) return;
            const collector = msg.createMessageComponentCollector({
                filter: (i => i.isSelectMenu() && i.customId == "filter_changing" && i.user.id == interaction.user.id),
                time: 60_000,
                max: 1,
            });
            collector.on("collect", i => {
                i.values.forEach(option => queue.effects[option] = !queue.effects[option]);
                i.reply({
                    content: `Changed ${i.values.length} Filter(s) to:\n> *Will be applied with the next Skip*`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor("FUCHSIA")
                            .setTitle("Current Filters")
                            .setDescription(Object.keys(queue.effects)
                                .filter(o => o != "bassboost" && o != "speed")
                                .map(option => `> **\`${option.charAt(0).toUpperCase()}${option.slice(1)}\`** - ${queue.effects[option] ? `✅ Enabled` : `❌ Disabled:`}`).join("\n\n")),
                    ],
                });
                // will be removed on .stop();
                queue.tracks = [queue.tracks[0], ...queue.tracks];
                queue.filtersChanged = true;
                const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;
                oldConnection.state.subscription.player.stop();
                oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, curPos));
            });
            collector.on("end", () => {
                msg.edit({
                    content: msg.content,
                    components: [new ActionRowBuilder().addComponents(Menu.setDisabled(true))],
                }).catch(() => null);
            });
        }
        catch (e) {
            console.error(e);
            interaction.reply({ content: `❌ Something went wrong: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` }).catch(() => null);
        }
    },
};