import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import dayjs = require('dayjs');
import customParseFormat = require('dayjs/plugin/customParseFormat');
import { ICommand } from '../../types';
dayjs.extend(customParseFormat);
require('dotenv').config();

// --------- importing database ---------
const db = {
    database: "afho",
};
const { updateDB, selectFromDB } = require(process.env.WORKPATH + "DB/DB_functions");

module.exports = {
    // --------- command setup ---------
    data: new SlashCommandBuilder()
        .setName('addbirthday')
        .setDescription('Add your birthday to the database!')
        .addStringOption(option =>
            option.setName('birthday')
                .setDescription('input your birthday as dd/mm/year')
                .setRequired(true)),
    // --------- command executes ---------
    async execute(interaction: CommandInteraction) {
        const username = interaction.user.tag;
        const serverId = interaction.guild?.id;

        const date = dayjs(interaction.options.getString('birthday'), "DD/MM/YYYY");
        if (date.isValid() === false) {
            await interaction.reply({ content: "Date format isn't valid!", ephemeral: true });
        }
        else {
            const query = 'SELECT * FROM birthdays WHERE username = ? AND serverId = ?';
            const args = [username, serverId];
            selectFromDB(db.database, query, args, (err, rows) => {
                if (err != null) {
                    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
                else if (rows.length > 0) {
                    const query2 = 'UPDATE birthdays SET birthdate = ? WHERE username = ? AND serverId = ?';
                    const args2 = [date.format("YYYY-MM-DD"), username, serverId];
                    updateDB(db.database, query2, args2, (err) => {
                        if (err != null) {
                            console.log(err)
                            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                        }
                        else {
                            interaction.reply("Updated your birthdate!");
                        }
                    });
                }
                else {
                    const query2 = 'INSERT INTO birthdays(username, birthdate, serverId) VALUES (?, ?, ?)';
                    const args2 = [username, date.format("YYYY-MM-DD"), serverId];
                    updateDB(db.database, query2, args2, (err) => {
                        if (err != null) {
                            console.log(err)
                            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                        }
                        else {
                            interaction.reply("Added your birthdate!");
                        }
                    });
                }
            });
        }
    },
} as ICommand;
