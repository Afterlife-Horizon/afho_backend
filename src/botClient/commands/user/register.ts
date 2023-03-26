import { CommandInteraction, GuildMemberRoleManager, SlashCommandBuilder } from 'discord.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'
import bcrypt from "bcrypt"
import BotClient from '../../BotClient';
import { ICommand } from '../../../types';
dayjs.extend(customParseFormat);
require('dotenv').config();

export default (client: BotClient) : ICommand => {

    const cleanOnError = (user: string) => {
        const query = `DELETE FROM ? WHERE name = ?`;
        const args = ["users", user];
        client.dbClient.updateDB(query, args, (err) => {
            if (err) {
                console.error(err);
            }
        });
    };
    
    const validateEmail = (email: string) => {
        return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    return {
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
        async execute(interaction: CommandInteraction) {
            
            const username = interaction.options.get("username")?.value as string;
            const email = interaction.options.get("email")?.value as string;
            const password = interaction.options.get("password")?.value as string;
            const confpassword = interaction.options.get("confpassword")?.value as string;
            const discordTag = interaction.user.tag;


            const member = interaction.member;
            if (!member) return interaction.reply({ content: "You are not in a guild!", ephemeral: true });
            const dsId = member.user.id;
            const channel = interaction.channel;

            if (!channel) return interaction.reply({ content: "You are not in a channel!", ephemeral: true });

            await interaction.reply({
                content: `executing!`,
                ephemeral: true,
            });
            await interaction.deleteReply();

            if (!validateEmail(email)) return channel.send({ content: "Email must be an email!" });
            if (password !== confpassword) return channel.send({ content: "passwords are not the same!" });
            const saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPass = await bcrypt.hash(password, salt);

            const roles = ["admin", "premium member", "member", "slave"];
            const roleCollection = member.roles as GuildMemberRoleManager;
            let isAdmin = 0;
            let isScPlayer = 0;
            let role = "";
            [...roleCollection.cache].forEach(dRole => {
                if (dRole[1].name === "admin") isAdmin = 1;
                if (dRole[1].name === "sc") isScPlayer = 1;
                if (roles.includes(dRole[1].name)) role = dRole[1].name;
            });

            channel.send({ content: `Adding user ${interaction.user} to Users!` });

            let query = `SELECT * FROM users WHERE name = ? OR discord_tag = ?`;
            let args: any[] = [username, discordTag];
            client.dbClient.selectFromDB(query, args, (err, rows) => {
                if (err) {
                    console.error(err);
                    channel.send({ content: `there was an error!` });
                }
                else if (rows.length > 0) {
                    channel.send({ content: `You already have an account!` });
                }
                else {
                    // ------------ INSERT IN USERS ------------
                    
                    query = `INSERT INTO users(discordId, name, discord_tag, email, role, password, isAdmin, isSCPlayer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    args = [dsId, username, discordTag, email, role, hashedPass, isAdmin, isScPlayer];
                    client.dbClient.updateDB(query, args, (err) => {
                        if (err) {
                            console.error(err);
                            channel.send({ content: `there was an error!` });
                        }
                        else {
                            // ------------ INSERT IN IMAGES ------------
                            query = `INSERT INTO images(type, path, user_id) VALUES (?, ?, (SELECT id FROM users WHERE users.name = ?))`;
                            args = ["", "", username];
                            client.dbClient.updateDB(query, args, (err) => {
                                if (err) {
                                    console.log(err);
                                    channel.send({ content: `there was an error!` });
                                    cleanOnError(username);
                                }
                                else {
                                    channel.send({ content: `Added ${interaction.user} to Users!` });
                                }
                            });
                        }
                    });
                }
            });
        },
    }
}