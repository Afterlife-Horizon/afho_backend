import fs from 'node:fs';
import path from'node:path';
import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import { ICommand } from './types';

require('dotenv').config();

const { clientId, token } = {
    clientId: process.env.CLIENTID,
    token: process.env.TOKEN
}

if (!token) throw new Error("No token provided");
if (!clientId) throw new Error("No client id provided");


// --------- Add commands ---------
const commands : RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
const commandsPath = path.join(process.env.WORKPATH || "./", 'commands');
fs.readdirSync(commandsPath).forEach(dir => {
    const directorypath = path.join(commandsPath, dir);
    fs.readdirSync(directorypath).filter(file => file.endsWith('.js')).forEach(file => {
        const filePath = path.join(directorypath, file);
        const command : ICommand = require(filePath);
        commands.push(command.data.toJSON());
    });
});


const rest = new REST({ version: '10' }).setToken(token);

if (process.env.METHOD === "add") {
    rest.put(Routes.applicationCommands(clientId), { body: commands })
        .then((data: any) => console.log(`Successfully registered ${data.length} application commands.`))
        .catch(console.error);
}

if (process.env.METHOD === "delete") {
    rest.put(Routes.applicationCommands(clientId), { body: [] })
        .then(() => console.log('Successfully deleted all application commands.'))
        .catch(console.error);
}
