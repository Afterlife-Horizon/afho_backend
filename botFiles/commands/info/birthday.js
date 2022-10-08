const { SlashCommandBuilder } = require('discord.js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
require('dotenv').config();

// --------- importing database ---------
const db = {
    database: "AFHObot",
};
require(process.env.WORKPATH + "DB/DB_functions")(db);

const { updateDB, selectFromDB } = db;

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
    async execute(interaction) {
        const username = interaction.user.tag;
        const serverId = interaction.guild.id;

        const date = dayjs(interaction.options.getString('birthday'), "DD/MM/YYYY");
        if (date.isValid() === false) {
            await interaction.reply({ content: "Date format isn't valid!", ephemeral: true });
        }
        else {
            console.log("[LOG] User used command addBirthday( ".yellow + date.format("DD/MM/YYYY").blue + " ): checking if user already has a birthday in the database!".yellow);
            const query = 'SELECT * FROM birthdays WHERE username = ? AND serverId = ?';
            const args = [username, serverId];
            selectFromDB(query, args, (err, rows) => {
                if (err != null) {
                    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
                else if (rows.length > 0) {
                    console.log("[LOG] user has one: Updating!".yellow);
                    const query2 = 'UPDATE birthdays SET birthdate = ? WHERE username = ? AND serverId = ?';
                    const args2 = [date.format("YYYY-MM-DD"), username, serverId];
                    updateDB(query2, args2, (err) => {
                        if (err != null) {
                            console.log('[LOG] Database error!'.red);
                            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                        }
                        else {
                            console.log("[LOG] Updated ".yellow + username.blue + " birthdate!".yellow);
                            interaction.reply("Updated your birthdate!");
                        }
                    });
                }
                else {
                    const query2 = 'INSERT INTO birthdays(username, birthdate, serverId) VALUES (?, ?, ?)';
                    const args2 = [username, date.format("YYYY-MM-DD"), serverId];
                    updateDB(query2, args2, (err) => {
                        if (err != null) {
                            console.log('[LOG] Database error!'.red);
                            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                        }
                        else {
                            console.log("[LOG] Added ".yellow + username.blue + " birthdate!".yellow);
                            interaction.reply("Added your birthdate!");
                        }
                    });
                }
            });
        }
    },
};
