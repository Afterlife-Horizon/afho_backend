const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Gives information about the current server!'),
    async execute(interaction) {
        console.log("[LOG] User typed: \"" + interaction + "\". Responding with Server information!".yellow);
        await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
    },
};