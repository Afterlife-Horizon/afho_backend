/* eslint-disable no-useless-escape */
// --------- basic imports ---------
require("colors");
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const connectHistoryApiFallback = require("connect-history-api-fallback");

// --------- importing discord.js / Init ---------
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    presence: {
        activity: {
            name: `/help`,
            type: "PLAYING",
        },
        status: "online",
    },
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: ["message", "channel", "reaction"],
    failIfNotExists: false,
    allowedMentions: {
        parse: ["roles", "users"],
        repliedUser: false,
    },
    shards: "auto",
});

// --------- importing config ---------
client.config = (process.env.NODE_ENV === 'dev') ? require('./config/devconfig.json') : require('./config/config.json');

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(dir => {
    const directorypath = path.join(commandsPath, dir);
    fs.readdirSync(directorypath).filter(file => file.endsWith('.js')).forEach(file => {
        const filePath = path.join(directorypath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    });
});

client.queues = new Collection();

require("./util/musicUtils.js")(client);

client.once('ready', () => {
    console.log("logged in as: " + client.user.tag);
    client.ready = true;
});

// ------------ Taking care of Slash commands ------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        // console.log(interaction);
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// ------------ Checking channels voice state updates ------------
client.on("voiceStateUpdate", async (oldState, newState) => {
    console.log("[LOG] Voice state has updated!".yellow);

    if (newState.id == client.user.id && newState.channelId && newState.channel.type == "GUILD_STAGE_VOICE" && newState.suppress) {
        if (newState.channel?.permissionsFor(newState.guild.me)?.has(PermissionFlagsBits.MuteMembers)) {
            console.log("[LOG] Unmuting!".yellow);
            await newState.guild.me.voice.setSuppressed(false).catch(() => null);
        }
    }

    if (newState.id == client.user.id) {
        console.log("[LOG] User is the bot!".yellow);
        return;
    }

    function stateChange(one, two) {
        return (one === false && two === true || one === true && two === false);
    }

    if (stateChange(oldState.streaming, newState.streaming) ||
        stateChange(oldState.serverDeaf, newState.serverDeaf) ||
        stateChange(oldState.serverMute, newState.serverMute) ||
        stateChange(oldState.selfDeaf, newState.selfDeaf) ||
        stateChange(oldState.selfMute, newState.selfMute) ||
        stateChange(oldState.selfVideo, newState.selfVideo) ||
        stateChange(oldState.suppress, newState.suppress)) {
        return;
    }

    // channel joins
    if (!oldState.channelId && newState.channelId) {
        console.log("[LOG] User joined channel!".yellow);
        return;
    }

    // channel leaves
    if (!newState.channelId && oldState.channelId || newState.channelId && oldState.channelId) {
        if (oldState.channel.members.filter(m => !m.user.bot).size <= 0) console.log("[LOG] Channel is empty!".yellow);
        setTimeout(() => {
            const connection = getVoiceConnection(newState.guild.id);
            if (oldState.channel.members.filter(m => !m.user.bot).size >= 1) return;
            // if (connection && oldState.channel.members.filter(m => !m.user.bot).size <= 0) connection.destroy();
            if (connection && connection.joinConfig.channelId == oldState.channelId) connection.destroy();
            return;
        }, 15000);
    }
});

const app = express();
const port = process.env.PORT || 4000;
const base_channelId = "941726047991369800";


const getJSONResponse = async (body) => {
    let fullBody = '';

    for await (const data of body) {
        fullBody += data.toString();
    }
    return JSON.parse(fullBody);
};

const brasilBoard = require("./api/brasilboard");
const connectedMembers = require("./api/connectedMembers");
const bresilMember = require("./api/brasil");

const musicSkip = require('./api/music/skip');
const musicPause = require('./api/music/pause');
const musicResume = require('./api/music/unpause');
const musicStop = require('./api/music/stop');
const musicClearQueue = require('./api/music/clearQueue');
const musicShuffle = require('./api/music/shuffle');

const musicSkipto = require('./api/music/skipto');
const musicRemove = require('./api/music/remove');
const musicPlay = require('./api/music/play');
const musicPlayFirst = require('./api/music/playFirst');
const musicDisconnect = require('./api/music/disconnect');
const musicFilters = require('./api/music/filters');
const musicFetch = require('./api/music/fetch');
const login = require('./api/music/login');
const loginAccess = require('./api/music/loginAccess');

app
    .use(express.json())
    .use('/api/brasilBoard', brasilBoard(client))
    .use('/api/connectedMembers', connectedMembers(client))
    .use('/api/bresilMember', bresilMember(client))
    .use("/api/skip", musicSkip(client))
    .use("/api/pause", musicPause(client))
    .use("/api/unpause", musicResume(client))
    .use("/api/stop", musicStop(client))
    .use("/api/clearqueue", musicClearQueue(client))
    .use("/api/shuffle", musicShuffle(client))
    .use("/api/skipto", musicSkipto(client))
    .use("/api/remove", musicRemove(client))
    .use("/api/disconnect", musicRemove(client))
    .use("/api/disconnect", musicDisconnect(client))
    .use("/api/play", musicPlay(client))
    .use("/api/playfirst", musicPlayFirst(client))
    .use("/api/filters", musicFilters(client))
    .use("/api/fetch", musicFetch(client))
    .use("/api/login", login())
    .use("/api/loginaccess", loginAccess())
    .use(connectHistoryApiFallback({verbose: false}))
    .use(express.static(path.join(__dirname, "../webapp/frontend/build")))
    .listen(port, () => console.log(`Listening on port ${port}`.toUpperCase().white.bgGreen.bold));


// --------- Loging in bot ---------
client.login(client.config.token);