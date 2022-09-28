// --------- basic imports ---------
require("colors");
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

// --------- importing discord.js / Init ---------
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { connect } = require("node:http2");


const client = new Client({
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

client.once('ready', () => {
    console.log("logged in as: " + client.user.tag);
    client.user.setPresence({
        activities: [{
            name: `${client.config.prefix} help | /help`,
            type: "PLAYING",
        }],
        status: "idle",
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.id === client.user.id && newState.channelId && newState.channel.type === "GUILD_STAGE_VOICE" && newState.supress) {

        if (newState.channel?.permissionsFor(newState.guild.me)?.has(PermissionFlagsBits.MuteMembers)) {
            await newState.guild.me.voice.setSuppressed(false).catch(() => null);
        }

        if (newState.id === client.user.id) return;

        const stateChange = (one, two) => {
            if (one === false && two === true || one === true && two === false) return true;
            else return false;
        };

        if (
            stateChange(oldState.streaming, newState.streaming) ||
            stateChange(oldState.serverDeaf, newState.serverDeaf) ||
            stateChange(oldState.serverMute, newState.serverMute) ||
            stateChange(oldState.selfDeaf, newState.selfDeaf) ||
            stateChange(oldState.selfMute, newState.selfMute) ||
            stateChange(oldState.selfVideo, newState.selfVideo) ||
            stateChange(oldState.suppress, newState.supress)
        ) return;

        if (!oldState.channelId && newState.channelId) return;

        if (!newState.channelId && oldState.channelId || newState.channelId && oldState.channelId) {
            const connection = getVoiceConnection(newState.guild.id);
            if (oldState.channel.filter(member => !member.user.bot && !member.voice.selfDeaf && !member.voice.serverDeaf).size >= 1) return;
            if (connection && connection.joinConfig.channelId == oldState.channelId) connection.destroy();
        }
    }
});

// --------- Loging in bot ---------
client.login(client.config.token);