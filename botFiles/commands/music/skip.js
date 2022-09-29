const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('skips the song!'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(() => null);
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(() => null);
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(() => null);

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch(() => null);
        }
        // no new songs (and no current)
        if (!queue.tracks || queue.tracks.length <= 1) {
            return interaction.reply(`👎 **Nothing to skip**`).catch(() => null);
        }
        queue.skipped = true;
        // skip the track
        oldConnection.state.subscription.player.stop();

        return interaction.reply(`⏭️ **Successfully skipped the Track**`).catch(() => null);
    },
};