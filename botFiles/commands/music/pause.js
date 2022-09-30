const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('pause the audio!'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(() => null);
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(() => null);

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch(() => null);
        }
        // if already paused
        if (queue.paused) return interaction.reply(`👎 **Track already paused**`).catch(() => null);

        queue.paused = true;

        // skip the track
        oldConnection.state.subscription.player.pause();

        return interaction.reply(`⏸️ **Successfully paused the Track**`).catch(() => null);
    },
};