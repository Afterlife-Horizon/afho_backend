import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Joins the voice channel!'),
    async execute(interaction) {
        try {
            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (oldConnection) return await interaction.reply({ content: `i'm already in a channel: <#${oldConnection.joinConfig.channelId}>!` });
            if (!interaction.member.voice.channelId) return await interaction.reply({ content: `Please join a voice channel first` });

            await interaction.client.joinVoiceChannel(interaction.member.voice.channel);
            interaction.client.currentChannel = interaction.member.voice.channel;
            await interaction.reply({ content: `joined voice channel!` });
        }
        catch (err) {
            console.log(err);
            interaction.reply({ content: `Could not join voice channel` });
        }
    },
};