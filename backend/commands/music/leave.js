const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

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
            console.log("[LOG] Left voice channel!".green);
            await interaction.reply({ content: `Left voice channel!` });
        }
        catch (err) {
            console.log(err);
            console.log("[LOG] Could not leave voice channel!".red);
            interaction.reply({ content: `Could not leave voice channel` });
        }
    },
};