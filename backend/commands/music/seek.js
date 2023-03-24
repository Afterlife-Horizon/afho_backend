const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seeks to a specific Position (secs)!')
        .addStringOption(option =>
            option.setName('secondes')
                .setDescription('Number of seconds to seek to!')
                .setRequired(true)),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply({ content: "👎 **Please join a Voice-Channel first!**" }).catch(() => null);

            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (!oldConnection) return interaction.reply({ content: "👎 **I'm not connected somewhere!**" }).catch(() => null);
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply({ content: "👎 **We are not in the same Voice-Channel**!" }).catch(() => null);

            const queue = interaction.client.queues.get(interaction.guild.id);
            if (!queue || !queue.tracks || !queue.tracks[0]) {
                return interaction.reply(`👎 **Nothing playing right now**`).catch(() => null);
            }

            const arg = interaction.options.getString('secondes');
            if (!arg || isNaN(arg)) return interaction.reply({ content: `👎 **You forgot to add the seeking-time!** Usage: \`/seek <Time-In-S>\`` }).catch(() => null);

            if (Number(arg) < 0 || Number(arg) > Math.floor(queue.tracks[0].duration / 1000 - 1)) {
                return interaction.reply({ content: `👎 **The Seek-Number-Pos must be between \`0\` and \`${Math.floor(queue.tracks[0].duration / 1000 - 1)}\`!**` }).catch(() => null);
            }

            const newPos = Number(arg) * 1000;
            // set Filterschanged to true
            queue.filtersChanged = true;
            // seek
            oldConnection.state.subscription.player.stop();
            oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, newPos));

            interaction.reply({ content: `⏩ **Seeked to \`${interaction.client.formatDuration(newPos)}\`**!` }).catch(() => null);
        }
        catch (e) {
            console.error(e);
            interaction.reply({ content: `❌ Could not join your VC because: \`\`\`${e.interaction || e}`.substring(0, 1950) + `\`\`\`` }).catch(() => null);
        }
    },
};