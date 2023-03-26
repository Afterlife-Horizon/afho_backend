import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, GuildMember, CollectedInteraction, StringSelectMenuInteraction, Colors, StringSelectMenuBuilder } from 'discord.js';
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('filters')
            .setDescription('Set filters!'),
        async execute(interaction) {
            try {
                const member = interaction.member as GuildMember;
                const guild = interaction.guild;

                if (!member || !guild) return await interaction.reply({ content: `Something went wrong` });
                if (!member.voice.channelId) return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch((err) => console.log(err));
                const oldConnection = getVoiceConnection(interaction.guild.id);
                if (!oldConnection) return interaction.reply({ content: `👎 **I'm not connected somewhere**!` }).catch((err) => console.log(err));

                const queue = client.queues.get(interaction.guild.id);
                if (!queue) return interaction.reply({ content: `👎 **I'm nothing playing right now.**` }).catch((err) => console.log(err));

                const options = Object.keys(queue.effects);

                const Menu = new StringSelectMenuBuilder()
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

                const msg = await interaction.channel?.send({
                    content: "🔗 Pick what filter(s) you want to change!",
                    components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(Menu)],
                }).catch(console.error);
                if (!msg) return;

                const state = oldConnection.state as VoiceConnectionReadyState;
                if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));

                const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
                if (!playerState || !playerState.resource || !playerState.resource.volume) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));        
        

                const collector = msg.createMessageComponentCollector({
                    filter: (i => i.isSelectMenu() && i.customId == "filter_changing" && i.user.id == interaction.user.id),
                    time: 60_000,
                    max: 1,
                });
                collector.on("collect", async (i : StringSelectMenuInteraction) => {
                    i.values.forEach(option => queue.effects[option] = !queue.effects[option]);
                    i.reply({
                        content: `Changed ${i.values.length} Filter(s) to:\n> *Will be applied with the next Skip*`,
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.Fuchsia)
                                .setTitle("Current Filters")
                                .setDescription(Object.keys(queue.effects)
                                    .filter(o => o != "bassboost" && o != "speed")
                                    .map(option => `> **\`${option.charAt(0).toUpperCase()}${option.slice(1)}\`** - ${queue.effects[option] ? `✅ Enabled` : `❌ Disabled:`}`).join("\n\n")),
                        ],
                    });

                    
                    queue.filtersChanged = true;
                    const curPos = playerState.resource.playbackDuration;
                    state.subscription?.player.stop();
                    state.subscription?.player.play(await client.getResource(queue, queue.tracks[0].id, curPos));
                });
                collector.on("end", () => {
                    Menu.setDisabled(true);
                    msg.edit({
                        content: msg.content,
                        components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(Menu)],
                    }).catch((err) => console.log(err));
                });
            }
            catch (e: any) {
                console.error(e);
                interaction.reply({ content: `❌ Something went wrong: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` }).catch((err) => console.log(err));
            }
        },
    }
};