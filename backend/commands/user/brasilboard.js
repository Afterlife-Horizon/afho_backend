const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brasilboard')
        .setDescription('Get brasil leaderboard!'),
    async execute(interaction) {
        await interaction.reply({ content: "https://music.afterlifehorizon.net/brasilboard" });
    },
};
