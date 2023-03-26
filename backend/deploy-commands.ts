import fs = require('node:fs');
import path = require('node:path');
import { REST, Routes } from 'discord.js';

require('dotenv').config();

const { clientId, guildId, token } = (process.env.NODE_ENV === 'dev') ? require('./config/devconfig.json') : require('./config/config.json');


// --------- Add commands ---------
const commands = [];
const commandsPath = path.join(process.env.WORKPATH, 'commands');
fs.readdirSync(commandsPath).forEach(dir => {
    const directorypath = path.join(commandsPath, dir);
    fs.readdirSync(directorypath).filter(file => file.endsWith('.js')).forEach(file => {
        const filePath = path.join(directorypath, file);
        const command = require(filePath);
        commands.push(command.data.toJSON());
    });
});


const rest = new REST({ version: '10' }).setToken(token);

if (process.env.METHOD === "add") {
    if (process.env.NODE_ENV === 'dev') {
        rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }).catch(console.error);
    }
    else {
        rest.put(Routes.applicationCommands(clientId), { body: commands }).catch(console.error);
    }
}

if (process.env.METHOD === "delete") {
    if (process.env.NODE_ENV === 'dev') {
        rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] }).catch(console.error);
    }
    else {
        // for global commands
        rest.put(Routes.applicationCommands(clientId), { body: [] }).catch(console.error);
    }
}
