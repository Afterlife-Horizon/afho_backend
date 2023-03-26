import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('seek')
            .setDescription('Seeks to a specific Position (secs)!')
            .addStringOption(option =>
                option.setName('secondes')
                    .setDescription('Number of seconds to seek to!')
                    .setRequired(true)),
        async execute(interaction) {
            try {
                const member = interaction.member as GuildMember;
                const guild = interaction.guild;
                if (!guild) return interaction.reply({ content: "👎 **Something went wrong**" }).catch((err) => console.log(err));
                if (!member.voice.channelId) return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch((err) => console.log(err));

                const oldConnection = getVoiceConnection(guild.id);
                if (!oldConnection) return interaction.reply({ content: "👎 **I'm not connected somewhere!**" }).catch((err) => console.log(err));
                if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply({ content: "👎 **We are not in the same Voice-Channel**!" }).catch((err) => console.log(err));

                const queue = client.queues.get(guild.id);
                if (!queue || !queue.tracks || !queue.tracks[0]) {
                    return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
                }

                const arg = interaction.options.get('secondes')?.value as number;
                if (!arg || isNaN(arg)) return interaction.reply({ content: `👎 **You forgot to add the seeking-time!** Usage: \`/seek <Time-In-S>\`` }).catch((err) => console.log(err));

                if (Number(arg) < 0 || Number(arg) > Math.floor(queue.tracks[0].duration / 1000 - 1)) {
                    return interaction.reply({ content: `👎 **The Seek-Number-Pos must be between \`0\` and \`${Math.floor(queue.tracks[0].duration / 1000 - 1)}\`!**` }).catch((err) => console.log(err));
                }

                const newPos = Number(arg) * 1000;
                queue.filtersChanged = true;

                const state = oldConnection.state as VoiceConnectionReadyState;
                if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));

                state.subscription.player.stop();
                state.subscription.player.play(client.getResource(queue, queue.tracks[0].id, newPos));

                interaction.reply({ content: `⏩ **Seeked to \`${client.formatDuration(newPos)}\`**!` }).catch((err) => console.log(err));
            }
            catch (e: any) {
                console.error(e);
                interaction.reply({ content: `❌ Could not join your VC because: \`\`\`${e.interaction || e}`.substring(0, 1950) + `\`\`\`` }).catch((err) => console.log(err));
            }
        },
    }
}