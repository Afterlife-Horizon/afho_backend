const { readdirSync } = require('fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();


module.exports = async client => {
    const slashcommandsPath = path.join(process.env.WORKPATH, 'slashcommands');
    const commandsPath = path.join(process.env.WORKPATH, 'commands');


    // ------------ Prefix Commands ------------
    readdirSync(commandsPath).filter(file => file.endsWith('.js'))
        .forEach(directory => {
            readdirSync(`${commandsPath}/${directory}`)
                .filter(file => file.endsWith('.js'))
                .forEach(file => {
                    const pull = require(`${commandsPath}/${directory}/${file}`);
                    console.log(`Successfully registered /${directory}/${file} application command.`);
                    client.commands.set(pull.name, pull);
                });
        });

    // ------------ Slash Commands ------------
    const slashcommandsArray = [];
    readdirSync(slashcommandsPath).forEach(dir => {
        readdirSync(`${slashcommandsPath}/${dir}`).filter(file => file.endsWith('.js'))
            .forEach(file => {
                const filePath = `${slashcommandsPath}/${dir}/${file}`;
                const command = require(filePath);
                slashcommandsArray.push(command.data.toJSON());
            });
    });

    const rest = new REST({ version: '10' }).setToken(client.config.token);
    if (client.deploySlash.enabled) {
        if (client.deploySlash.guilds) {
            rest.put(Routes.applicationGuildCommands(client.config.clientId, client.config.guildId), { body: slashcommandsArray })
                .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
                .catch(console.error);
        }
        else {
            rest.put(Routes.applicationCommands(client.config.clientId), { body: client.config.commands })
                .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
                .catch(console.error);
        }
    }

    // ------------ Error Handling ------------
    process.on("unhandledRejection", (reason, p) => {
        console.log("unhandledRejection: ");
        console.log(reason);
        console.log(p);
    });

    process.on("uncaughtException", (err, p) => {
        console.log("uncaughtException: ");
        console.log(err);
        console.log(p);
    });

    process.on("uncaughtExceptionMonitor", (err, p) => {
        console.log("uncaughtExceptionMonitor: ");
        console.log(err);
        console.log(p);

    });

};