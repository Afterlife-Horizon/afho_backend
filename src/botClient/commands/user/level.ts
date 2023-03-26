import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import getLevelFromXp from "../../../functions/getLevelFromXp";
import BotClient from '../../BotClient';
require('dotenv').config();


export default (client: BotClient) => {
    return {
        data: new SlashCommandBuilder()
            .setName('level')
            .setDescription('get member\'s level!')
            .addStringOption(option =>
                option.setName('member')
                    .setDescription('member you want to move!')
                    .setRequired(true)),
        async execute(interaction) {
            try {
                const messageMember = interaction.options.getString('member');
                const memberid = messageMember.replace(/\D/g, '');

                client.dbClient.selectFromDB('SELECT xp FROM bot_levels WHERE id = ?', [memberid], (err, rows) => {
                    if (err != null) {
                        console.log(err);
                        interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                    else if (rows.length > 0) {
                        const embed = new EmbedBuilder()
                            .setTitle(`Level of ${messageMember}`)
                            .setDescription(`Level: ${getLevelFromXp(rows[0].xp)}\nXP: ${rows[0].xp}`)
                            .setColor(0x00AE86)
                            .setTimestamp();
                        interaction.reply({ embeds: [embed] });
                    }
                    else {
                        const embed = new EmbedBuilder()
                            .setTitle(`Level of ${messageMember}`)
                            .setDescription(`Level: 0\nXP: 0`)
                            .setColor(0x00AE86)
                            .setTimestamp();
                        interaction.reply({ embeds: [embed] });
                    }
                });
            }
            catch (err) {
                console.error(err);
                await interaction.reply({ content: `❌ An error occured!` });
            }
        },
    }
};

