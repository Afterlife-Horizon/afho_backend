const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearqueue')
        .setDescription('clear the queue!'),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");

            const oldConnection = getVoiceConnection(interaction.guildId);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!");

            const queue = interaction.client.queues.get(interaction.guildId);
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`);
            }

            queue.tracks = [queue.tracks[0]];


            return interaction.reply(`🪣 **Successfully cleared the Queue.**`);
        }
        catch (err) {
            console.log(err);
        }
    },
};