import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leaves the voice channel!'),
    async execute(interaction) {
        try {
            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (!oldConnection) return await interaction.reply({ content: `I am not in a voice channel!` });
            if (!interaction.member.voice.channelId) return await interaction.reply({ content: `Please join a voice channel first` });

            await interaction.client.leaveVoiceChannel(interaction.member.voice.channel);
            await interaction.reply({ content: `Left voice channel!` });
        }
        catch (err) {
            console.log(err);
            interaction.reply({ content: `Could not leave voice channel` });
        }
    },
};