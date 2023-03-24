const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        console.log("[LOG] User typed: \"".yellow + interaction.yellow + "\". replying current ping!".yellow);
        await interaction.reply(`Pong! My ping is ${interaction.client.ws.ping}`)
            .catch(() => null);
    },
};