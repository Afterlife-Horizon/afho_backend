const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the audio!'),
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
            // if already paused
            if (!queue.paused) return interaction.reply(`👎 **Track is not paused**`);

            queue.paused = false;

            // skip the track
            oldConnection.state.subscription.player.unpause();

            return interaction.reply(`▶️ **Successfully resumed the Track**`);
        }
        catch (err) {
            console.log(err);
        }
    },
};