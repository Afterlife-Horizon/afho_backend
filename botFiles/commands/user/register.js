const { SlashCommandBuilder } = require('discord.js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const bcrypt = require("bcrypt");
dayjs.extend(customParseFormat);
require('dotenv').config();

const db = {
    database: "AFHO",
};
require(process.env.WORKPATH + "DB/DB_functions")(db);

const { updateDB, selectFromDB } = db;

module.exports = {
    // --------- command setup ---------
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register for discord bot and website!')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('choose a username! { please note that this user is also for the website }')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('email')
                .setDescription('choose an email! ')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('input a password!')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('confpassword')
                .setDescription('confirm the password!')
                .setRequired(true)),
    // --------- command executes ---------
    async execute(interaction) {
        const username = interaction.options.getString("username");
        const email = interaction.options.getString("email");
        const password = interaction.options.getString("password");
        const confpassword = interaction.options.getString("confpassword");
        const discordTag = interaction.user.tag;


        const member = interaction.member;
        const channel = interaction.channel;
        await interaction.reply({
            content: `executing!`,
        });
        await interaction.deleteReply();

        if (!validateEmail(email)) return channel.send({ content: "Email must be an email!", ephemeral: true });
        if (password !== confpassword) return channel.send({ content: "passwords are not the same!", ephemeral: true });
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPass = await bcrypt.hash(password, salt);

        const roles = ["admin", "premium member", "member", "slave"];
        const roleCollection = await member.roles.cache.filter(r => roles.indexOf(r.name) >= 0);
        const role = [...roleCollection][0][1].name;
        let isAdmin = 0;
        switch (role === 'admin') {
            case false: isAdmin = 0; break;
            case true: isAdmin = 1; break;
        }

        channel.send({ content: `Adding user ${interaction.user} to Users!` });
        console.log("[LOG] Checking user ".yellow + username.blue);
        console.log("-------------------------------------------------------".yellow);
        let query = `SELECT * FROM users WHERE name = ? OR discord_tag = ?`;
        let args = [username, discordTag];
        selectFromDB(query, args, (err, rows) => {
            if (err) {
                console.error(err);
                channel.send({ content: `there was an error!`, ephemeral: true });
            }
            else if (rows.length > 0) {
                console.log("[LOG] User ".yellow + username.blue + " already exists".yellow);
                channel.send({ content: `You already have an account!` });
            }
            else {
                // ------------ INSERT IN USERS ------------
                console.log("[DB] Inserting user:  ".yellow + username.blue + " into database AFHO(users)".yellow);
                query = `INSERT INTO users(name, discord_tag, email, role, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)`;
                args = [username, discordTag, email, role, hashedPass, isAdmin];
                updateDB(query, args, (err) => {
                    if (err) {
                        console.error(err);
                        channel.send({ content: `there was an error!`, ephemeral: true });
                    }
                    else {
                        console.log("[DB] Inserted user:  ".brightGreen + username.blue + " into database AFHO(users) successfully".brightGreen);
                        console.log("-------------------------------------------------------".yellow);

                        // ------------ INSERT IN IMAGES ------------
                        console.log("[DB] Inserting user:  ".yellow + username.blue + " into database AFHO(images)".yellow);

                        query = `INSERT INTO images(type, path, user_id) VALUES (?, ?, (SELECT id FROM users WHERE users.name = ?))`;
                        args = ["", "", username];
                        updateDB(query, args, (err) => {
                            if (err) {
                                console.log(err);
                                channel.send({ content: `there was an error!`, ephemeral: true });
                                cleanOnError(username);
                            }
                            else {
                                console.log("[DB] Inserted user:  ".brightGreen + username.blue + " into database AFHO(images) successfully".brightGreen);
                                console.log("[LOG] Inserted user:  ".brightGreen + username.blue + " successfully".brightGreen);
                                console.log("-------------------------------------------------------".yellow);
                                channel.send({ content: `Added ${interaction.user} to Users!` });
                            }
                        });
                    }
                });
            }
        });
    },
};

const cleanOnError = (user) => {
    console.log("-------------------------------------------------------".yellow);
    console.log("[DB] Cleaning database!".yellow);
    const query = `DELETE FROM ? WHERE name = ?`;
    const args = ["users", user];
    updateDB(query, args, (err) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log("[DB] Cleaned database!".yellow);
            console.log("-------------------------------------------------------".yellow);
        }
    });
};

const validateEmail = (email) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};