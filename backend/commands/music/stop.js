const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the audio and clear the queue!'),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");
            // get an old connection
            const oldConnection = getVoiceConnection(interaction.guildId);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!");

            const queue = interaction.client.queues.get(interaction.guildId);
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`);
            }
            // no new songs (and no current)
            queue.tracks = [];
            // skip the track
            oldConnection.state.subscription.player.stop();

            return interaction.reply(`🛑 **Successfully stopped playing and cleared the Queue.**`);
        }
        catch (err) {
            console.log(err);
        }
    },
};