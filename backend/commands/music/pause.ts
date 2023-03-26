import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('pause the audio!'),
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
            if (queue.paused) return interaction.reply(`👎 **Track already paused**`);

            queue.paused = true;

            // skip the track
            oldConnection.state.subscription.player.pause();

            return interaction.reply(`⏸️ **Successfully paused the Track**`);
        }
        catch (err) {
            console.log(err);
        }
    },
};