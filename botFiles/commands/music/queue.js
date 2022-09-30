const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('shows the queue!'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(() => null);
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(() => null);
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(() => null);

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue || !queue.tracks || !queue.tracks[0]) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch(() => null);
        }
        const e2n = s => s ? "✅ Enabled" : "❌ Disabled";
        const song = queue.tracks[0];
        const queueEmbed = new EmbedBuilder().setColor("FUCHSIA")
            .setTitle(`First 10 Songs in the Queue`)
            .setDescription(`**CURRENT:** \`0th)\` \`${song.durationFormatted}\` - [${song.title}](${interaction.client.getYTLink(song.id)}) - ${song.requester}`)
            .addFields(
                { name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
                { name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
                { name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true },
            )
            .addFields(
                queue.tracks.slice(1).slice(0, 10).map((track, index) => {
                    return {
                        name: `Track \`${interaction.client.queuePos(index + 1)}\` - \`${track.durationFormatted}\``,
                        value: `> [${track.title}](${interaction.client.getYTLink(track.id)}) - ${track.requester}`,
                        inline: false,
                    };
                }),
            );
        return interaction.reply({ content: `ℹ️ **Currently there are ${queue.tracks.length - 1} Tracks in the Queue**`, embeds: [queueEmbed] }).catch(() => null);
    },
};