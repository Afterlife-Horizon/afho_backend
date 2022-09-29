const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Gives information about the current server!'),
    async execute(interaction) {
        console.log("[LOG] User typed: \"" + interaction.commandName + "\". Responding with Server information!".yellow);
        const serverinfo = new EmbedBuilder().setTitle("Server Info")
            .setDescription("Displaying information about the current server!")
            .addFields(
                { name: "Server name", value: `${interaction.guild.name}` },
                { name: "Total members", value: `${interaction.guild.memberCount}` },
            );

        await interaction.reply({ embeds: [serverinfo] });
    },
};