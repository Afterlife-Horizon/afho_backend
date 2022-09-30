const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forward')
        .setDescription('Forwards for X (secs)!')
        .addStringOption(option =>
            option.setName('seconds')
                .setDescription('From -20 to +20!')
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

            const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;

            const arg = interaction.options.getString("seconds");

            if (!arg || isNaN(arg)) return interaction.reply({ content: `👎 **You forgot to add the forwarding-time!** Usage: \`/forward <Time-In-S>\`` }).catch(() => null);

            if (Number(arg) < 0 || Number(arg) > Math.floor((queue.tracks[0].duration - curPos) / 1000 - 1)) {
                return interaction.reply({ content: `👎 **The Forward-Number-Pos must be between \`0\` and \`${Math.floor((queue.tracks[0].duration - curPos) / 1000 - 1)}\`!**` }).catch(() => null);
            }
            const newPos = curPos + Number(arg) * 1000;
            // set Filterschanged to true
            queue.filtersChanged = true;
            // seek
            oldConnection.state.subscription.player.stop();
            oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, newPos));

            interaction.reply({ content: `⏩ **Forwarded for \`${arg}s\` to \`${interaction.client.formatDuration(newPos)}\`**!` }).catch(() => null);
        }
        catch (e) {
            console.error(e);
            interaction.reply({ content: `❌ Could not join your VC because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\`` }).catch(() => null);
        }
    },
};