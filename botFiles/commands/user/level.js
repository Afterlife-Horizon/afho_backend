const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fsPromises = require('fs/promises');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('get member\'s level!')
        .addStringOption(option =>
            option.setName('member')
                .setDescription('member you want to move!')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const member = interaction.options.getString('member');
            const filePath = path.resolve(process.env.WORKPATH, `config/levels.json`);
            const data = await fsPromises.readFile(filePath);
            const levels = JSON.parse(data);
            let lvl = levels.filter(m => m.id === member.user.id)[0]?.lvl;
            let xp = levels.filter(m => m.id === member.user.id)[0]?.xp;

            if (!lvl || !xp) return interaction.reply({ content: `${member} has not sent any messages yet!` });

            await interaction.reply({ content: `${member}'s level is: ${lvl} with ${xp} messages sent!` });
        }
        catch (err) {
            console.error(err);
            await interaction.reply({ content: `❌ An error occured!` });
        }
    },
};

