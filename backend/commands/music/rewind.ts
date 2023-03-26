import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewind')
        .setDescription('rewinds the song for X secs!')
        .addStringOption(option =>
            option.setName('secondes')
                .setDescription('Number of seconds to rewind!')
                .setRequired(true)),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch((err) => console.log(err));

            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (!oldConnection) return interaction.reply({ content: "👎 **I'm not connected somewhere!**" }).catch((err) => console.log(err));
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply({ content: "👎 **We are not in the same Voice-Channel**!" }).catch((err) => console.log(err));

            const queue = interaction.client.queues.get(interaction.guild.id);
            if (!queue || !queue.tracks || !queue.tracks[0]) {
                return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
            }
            const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;

            const arg = interaction.options.getString('secondes');
            if (!arg || isNaN(arg)) return interaction.reply({ content: `👎 **You forgot to add the rewinding-time!** Usage: \`/rewind <Time-In-S>\`` }).catch((err) => console.log(err));
            if (Math.floor(curPos / 1000 - 1) <= 0) return interaction.reply({ content: `👎 **There is nothing to rewind, play a song long enough!**` }).catch((err) => console.log(err));
            if (Number(arg) < 0 || Number(arg) > Math.floor((curPos) / 1000 - 1)) {
                return interaction.reply({ content: `👎 **The Rewind-Number-Pos must be between \`0\` and \`${Math.floor((curPos) / 1000 - 1)}\`!**` }).catch((err) => console.log(err));
            }

            const newPos = curPos - Number(arg) * 1000;
            // set Filterschanged to true
            queue.filtersChanged = true;
            // seek
            oldConnection.state.subscription.player.stop();
            oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, newPos));

            interaction.reply({ content: `⏪ **Rewinded for \`${arg}s\` to \`${interaction.client.formatDuration(newPos)}\`**!` }).catch((err) => console.log(err));
        }
        catch (e) {
            console.error(e);
            interaction.reply({ content: `❌ Could not join your VC because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` }).catch((err) => console.log(err));
        }
    },
};