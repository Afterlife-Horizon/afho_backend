const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

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
            console.log("[LOG] Joined voice channel!".green);
            await interaction.reply({ content: `joined voice channel!` });
        }
        catch (err) {
            console.log(err);
            console.log("[LOG] Could not join voice channel!".red);
            interaction.reply({ content: `Could not join voice channel` });
        }
    },
};