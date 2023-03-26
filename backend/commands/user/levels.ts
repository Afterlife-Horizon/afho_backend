import { SlashCommandBuilder } from 'discord.js';
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levels')
        .setDescription('Get level leaderboard!'),
    async execute(interaction) {
        await interaction.reply({ content: "https://music.afterlifehorizon.net/levels" });
    },
};
