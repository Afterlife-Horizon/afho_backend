/* eslint-disable no-useless-escape */
// --------- basic imports ---------
require("colors");
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { default: YouTube } = require('youtube-sr');
const { request } = require('undici');
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
});

// ------------ Taking care of Slash commands ------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        console.log(interaction);
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
        if (one === false && two === true || one === true && two === false) return true;
        else return false;
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

app
    .use(express.json())
    .get("/api/skip", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };

        try {
            const skipInteraction = {
                client: client,
                reply: (msg) => send(msg),
                bot: true,
                isChatInputCommand: () => true,
                type: 2,
                id: '1027148824524894258',
                applicationId: '1024250006800183396',
                channelId: '941726047991369800',
                guildId: '941701148883161118',
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    flags: { bitfield: 128 },
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                member: {
                    voice: {
                        channelId: client.currentChannel.id,
                    },
                    guild: {
                        id: '941701148883161118',
                        name: 'Afterlife Horizon',
                        icon: '3e2c794b9a0ba978453defec2f7d544f',
                        available: true,
                        shardId: 0,
                        splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                        banner: null,
                        description: null,
                        verificationLevel: 0,
                        vanityURLCode: null,
                        nsfwLevel: 0,
                        premiumSubscriptionCount: 4,
                        discoverySplash: null,
                        memberCount: 40,
                        large: false,
                        premiumProgressBarEnabled: true,
                        applicationId: null,
                        afkTimeout: 300,
                        afkChannelId: null,
                        systemChannelId: '941701148883161122',
                        premiumTier: 1,
                        widgetEnabled: null,
                        widgetChannelId: null,
                        explicitContentFilter: 0,
                        mfaLevel: 0,
                        joinedTimestamp: 1664458476022,
                        defaultMessageNotifications: 1,
                        maximumMembers: 500000,
                        maximumPresences: null,
                        maxVideoChannelUsers: 25,
                        approximateMemberCount: null,
                        approximatePresenceCount: null,
                        vanityURLUses: null,
                        rulesChannelId: null,
                        publicUpdatesChannelId: null,
                        preferredLocale: 'en-US',
                        ownerId: '756222140524658810',
                    },
                    joinedTimestamp: 1644589449863,
                    premiumSinceTimestamp: 1644590643837,
                    nickname: 'カーラ',
                    pending: false,
                    communicationDisabledUntilTimestamp: null,
                    _roles: [
                        '941703723774791680',
                        '941717032515301426',
                        '1009957459441487892',
                        '941702832170610709',
                    ],
                    user: {
                        id: '756222140524658810',
                        bot: false,
                        system: false,
                        username: 'Bot',
                        discriminator: '8371',
                        avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                        banner: undefined,
                        accentColor: undefined,
                    },
                    avatar: null,
                },
                version: 1,
                appPermissions: { bitfield: 4398046511103n },
                memberPermissions: { bitfield: 4398046511103n },
                locale: 'en-US',
                guildLocale: 'en-US',
                commandId: '1025036853537165343',
                commandName: 'skip',
                commandType: 1,
                commandGuildId: null,
                deferred: false,
                replied: false,
                ephemeral: null,
                webhook: { id: '1024250006800183396' },
                options: {
                    _group: null,
                    _subcommand: null,
                    _hoistedOptions: [],
                },
            };
            await client.emit('interactionCreate', skipInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .get("/api/pause", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };


        try {
            const pauseInteraction = {
                client: client,
                reply: (msg) => send(msg),
                bot: true,
                isChatInputCommand: () => true,
                type: 2,
                id: '1027148824524894258',
                applicationId: '1024250006800183396',
                channelId: '941726047991369800',
                guildId: '941701148883161118',
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    flags: { bitfield: 128 },
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                member: {
                    voice: {
                        channelId: client.currentChannel.id,
                    },
                    guild: {
                        id: '941701148883161118',
                        name: 'Afterlife Horizon',
                        icon: '3e2c794b9a0ba978453defec2f7d544f',
                        available: true,
                        shardId: 0,
                        splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                        banner: null,
                        description: null,
                        verificationLevel: 0,
                        vanityURLCode: null,
                        nsfwLevel: 0,
                        premiumSubscriptionCount: 4,
                        discoverySplash: null,
                        memberCount: 40,
                        large: false,
                        premiumProgressBarEnabled: true,
                        applicationId: null,
                        afkTimeout: 300,
                        afkChannelId: null,
                        systemChannelId: '941701148883161122',
                        premiumTier: 1,
                        widgetEnabled: null,
                        widgetChannelId: null,
                        explicitContentFilter: 0,
                        mfaLevel: 0,
                        joinedTimestamp: 1664458476022,
                        defaultMessageNotifications: 1,
                        maximumMembers: 500000,
                        maximumPresences: null,
                        maxVideoChannelUsers: 25,
                        approximateMemberCount: null,
                        approximatePresenceCount: null,
                        vanityURLUses: null,
                        rulesChannelId: null,
                        publicUpdatesChannelId: null,
                        preferredLocale: 'en-US',
                        ownerId: '756222140524658810',
                    },
                    joinedTimestamp: 1644589449863,
                    premiumSinceTimestamp: 1644590643837,
                    nickname: 'カーラ',
                    pending: false,
                    communicationDisabledUntilTimestamp: null,
                    _roles: [
                        '941703723774791680',
                        '941717032515301426',
                        '1009957459441487892',
                        '941702832170610709',
                    ],
                    user: {
                        id: '756222140524658810',
                        bot: false,
                        system: false,
                        username: 'Bot',
                        discriminator: '8371',
                        avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                        banner: undefined,
                        accentColor: undefined,
                    },
                    avatar: null,
                },
                version: 1,
                appPermissions: { bitfield: 4398046511103n },
                memberPermissions: { bitfield: 4398046511103n },
                locale: 'en-US',
                guildLocale: 'en-US',
                commandId: '1025036853495210082',
                commandName: 'pause',
                commandType: 1,
                commandGuildId: null,
                deferred: false,
                replied: false,
                ephemeral: null,
                webhook: { id: '1024250006800183396' },
                options: {
                    _group: null,
                    _subcommand: null,
                    _hoistedOptions: [],
                },
            };
            await client.emit('interactionCreate', pauseInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .get("/api/unpause", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };

        try {
            const unPauseInteraction = {
                client: client,
                reply: (msg) => send(msg),
                bot: true,
                isChatInputCommand: () => true,
                type: 2,
                id: '1027148824524894258',
                applicationId: '1024250006800183396',
                channelId: '941726047991369800',
                guildId: '941701148883161118',
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    flags: { bitfield: 128 },
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                member: {
                    voice: {
                        channelId: client.currentChannel.id,
                    },
                    guild: {
                        id: '941701148883161118',
                        name: 'Afterlife Horizon',
                        icon: '3e2c794b9a0ba978453defec2f7d544f',
                        available: true,
                        shardId: 0,
                        splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                        banner: null,
                        description: null,
                        verificationLevel: 0,
                        vanityURLCode: null,
                        nsfwLevel: 0,
                        premiumSubscriptionCount: 4,
                        discoverySplash: null,
                        memberCount: 40,
                        large: false,
                        premiumProgressBarEnabled: true,
                        applicationId: null,
                        afkTimeout: 300,
                        afkChannelId: null,
                        systemChannelId: '941701148883161122',
                        premiumTier: 1,
                        widgetEnabled: null,
                        widgetChannelId: null,
                        explicitContentFilter: 0,
                        mfaLevel: 0,
                        joinedTimestamp: 1664458476022,
                        defaultMessageNotifications: 1,
                        maximumMembers: 500000,
                        maximumPresences: null,
                        maxVideoChannelUsers: 25,
                        approximateMemberCount: null,
                        approximatePresenceCount: null,
                        vanityURLUses: null,
                        rulesChannelId: null,
                        publicUpdatesChannelId: null,
                        preferredLocale: 'en-US',
                        ownerId: '756222140524658810',
                    },
                    joinedTimestamp: 1644589449863,
                    premiumSinceTimestamp: 1644590643837,
                    nickname: 'カーラ',
                    pending: false,
                    communicationDisabledUntilTimestamp: null,
                    _roles: [
                        '941703723774791680',
                        '941717032515301426',
                        '1009957459441487892',
                        '941702832170610709',
                    ],
                    user: {
                        id: '756222140524658810',
                        bot: false,
                        system: false,
                        username: 'Bot',
                        discriminator: '8371',
                        avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                        banner: undefined,
                        accentColor: undefined,
                    },
                    avatar: null,
                },
                version: 1,
                appPermissions: { bitfield: 4398046511103n },
                memberPermissions: { bitfield: 4398046511103n },
                locale: 'en-US',
                guildLocale: 'en-US',
                commandId: '1025036853537165342',
                commandName: 'resume',
                commandType: 1,
                commandGuildId: null,
                deferred: false,
                replied: false,
                ephemeral: null,
                webhook: { id: '1024250006800183396' },
                options: {
                    _group: null,
                    _subcommand: null,
                    _hoistedOptions: [],
                },
            };
            await client.emit('interactionCreate', unPauseInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .get("/api/stop", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };

        const stopInteraction = {
            client: client,
            reply: (msg) => send(msg),
            bot: true,
            isChatInputCommand: () => true,
            type: 2,
            id: '1027148824524894258',
            applicationId: '1024250006800183396',
            channelId: '941726047991369800',
            guildId: '941701148883161118',
            user: {
                id: '756222140524658810',
                bot: false,
                system: false,
                flags: { bitfield: 128 },
                username: 'Bot',
                discriminator: '8371',
                avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                banner: undefined,
                accentColor: undefined,
            },
            member: {
                voice: {
                    channelId: client.currentChannel.id,
                },
                guild: {
                    id: '941701148883161118',
                    name: 'Afterlife Horizon',
                    icon: '3e2c794b9a0ba978453defec2f7d544f',
                    available: true,
                    shardId: 0,
                    splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                    banner: null,
                    description: null,
                    verificationLevel: 0,
                    vanityURLCode: null,
                    nsfwLevel: 0,
                    premiumSubscriptionCount: 4,
                    discoverySplash: null,
                    memberCount: 40,
                    large: false,
                    premiumProgressBarEnabled: true,
                    applicationId: null,
                    afkTimeout: 300,
                    afkChannelId: null,
                    systemChannelId: '941701148883161122',
                    premiumTier: 1,
                    widgetEnabled: null,
                    widgetChannelId: null,
                    explicitContentFilter: 0,
                    mfaLevel: 0,
                    joinedTimestamp: 1664458476022,
                    defaultMessageNotifications: 1,
                    maximumMembers: 500000,
                    maximumPresences: null,
                    maxVideoChannelUsers: 25,
                    approximateMemberCount: null,
                    approximatePresenceCount: null,
                    vanityURLUses: null,
                    rulesChannelId: null,
                    publicUpdatesChannelId: null,
                    preferredLocale: 'en-US',
                    ownerId: '756222140524658810',
                },
                joinedTimestamp: 1644589449863,
                premiumSinceTimestamp: 1644590643837,
                nickname: 'カーラ',
                pending: false,
                communicationDisabledUntilTimestamp: null,
                _roles: [
                    '941703723774791680',
                    '941717032515301426',
                    '1009957459441487892',
                    '941702832170610709',
                ],
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                avatar: null,
            },
            version: 1,
            appPermissions: { bitfield: 4398046511103n },
            memberPermissions: { bitfield: 4398046511103n },
            locale: 'en-US',
            guildLocale: 'en-US',
            commandId: '1025036853537165345',
            commandName: 'stop',
            commandType: 1,
            commandGuildId: null,
            deferred: false,
            replied: false,
            ephemeral: null,
            webhook: { id: '1024250006800183396' },
            options: {
                _group: null,
                _subcommand: null,
                _hoistedOptions: [],
            },
        };
        try {
            await client.emit('interactionCreate', stopInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .get("/api/clearqueue", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };


        try {
            const clearqueueInteraction = {
                client: client,
                reply: (msg) => send(msg),
                bot: true,
                isChatInputCommand: () => true,
                type: 2,
                id: '1027148824524894258',
                applicationId: '1024250006800183396',
                channelId: '941726047991369800',
                guildId: '941701148883161118',
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    flags: { bitfield: 128 },
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                member: {
                    voice: {
                        channelId: client.currentChannel.id,
                    },
                    guild: {
                        id: '941701148883161118',
                        name: 'Afterlife Horizon',
                        icon: '3e2c794b9a0ba978453defec2f7d544f',
                        available: true,
                        shardId: 0,
                        splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                        banner: null,
                        description: null,
                        verificationLevel: 0,
                        vanityURLCode: null,
                        nsfwLevel: 0,
                        premiumSubscriptionCount: 4,
                        discoverySplash: null,
                        memberCount: 40,
                        large: false,
                        premiumProgressBarEnabled: true,
                        applicationId: null,
                        afkTimeout: 300,
                        afkChannelId: null,
                        systemChannelId: '941701148883161122',
                        premiumTier: 1,
                        widgetEnabled: null,
                        widgetChannelId: null,
                        explicitContentFilter: 0,
                        mfaLevel: 0,
                        joinedTimestamp: 1664458476022,
                        defaultMessageNotifications: 1,
                        maximumMembers: 500000,
                        maximumPresences: null,
                        maxVideoChannelUsers: 25,
                        approximateMemberCount: null,
                        approximatePresenceCount: null,
                        vanityURLUses: null,
                        rulesChannelId: null,
                        publicUpdatesChannelId: null,
                        preferredLocale: 'en-US',
                        ownerId: '756222140524658810',
                    },
                    joinedTimestamp: 1644589449863,
                    premiumSinceTimestamp: 1644590643837,
                    nickname: 'カーラ',
                    pending: false,
                    communicationDisabledUntilTimestamp: null,
                    _roles: [
                        '941703723774791680',
                        '941717032515301426',
                        '1009957459441487892',
                        '941702832170610709',
                    ],
                    user: {
                        id: '756222140524658810',
                        bot: false,
                        system: false,
                        username: 'Bot',
                        discriminator: '8371',
                        avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                        banner: undefined,
                        accentColor: undefined,
                    },
                    avatar: null,
                },
                version: 1,
                appPermissions: { bitfield: 4398046511103n },
                memberPermissions: { bitfield: 4398046511103n },
                locale: 'en-US',
                guildLocale: 'en-US',
                commandId: '1025036853495210079',
                commandName: 'clearqueue',
                commandType: 1,
                commandGuildId: null,
                deferred: false,
                replied: false,
                ephemeral: null,
                webhook: { id: '1024250006800183396' },
                options: {
                    _group: null,
                    _subcommand: null,
                    _hoistedOptions: [],
                },
            };
            await client.emit('interactionCreate', clearqueueInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .get("/api/shuffle", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const send = (msg) => {
            channel.send(msg);
        };

        try {
            const stopInteraction = {
                client: client,
                reply: (msg) => send(msg),
                bot: true,
                isChatInputCommand: () => true,
                type: 2,
                id: '1027148824524894258',
                applicationId: '1024250006800183396',
                channelId: '941726047991369800',
                guildId: '941701148883161118',
                user: {
                    id: '756222140524658810',
                    bot: false,
                    system: false,
                    flags: { bitfield: 128 },
                    username: 'Bot',
                    discriminator: '8371',
                    avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                    banner: undefined,
                    accentColor: undefined,
                },
                member: {
                    voice: {
                        channelId: client.currentChannel.id,
                    },
                    guild: {
                        id: '941701148883161118',
                        name: 'Afterlife Horizon',
                        icon: '3e2c794b9a0ba978453defec2f7d544f',
                        available: true,
                        shardId: 0,
                        splash: 'cc5c48725d0abc2c5d564833e70de2b0',
                        banner: null,
                        description: null,
                        verificationLevel: 0,
                        vanityURLCode: null,
                        nsfwLevel: 0,
                        premiumSubscriptionCount: 4,
                        discoverySplash: null,
                        memberCount: 40,
                        large: false,
                        premiumProgressBarEnabled: true,
                        applicationId: null,
                        afkTimeout: 300,
                        afkChannelId: null,
                        systemChannelId: '941701148883161122',
                        premiumTier: 1,
                        widgetEnabled: null,
                        widgetChannelId: null,
                        explicitContentFilter: 0,
                        mfaLevel: 0,
                        joinedTimestamp: 1664458476022,
                        defaultMessageNotifications: 1,
                        maximumMembers: 500000,
                        maximumPresences: null,
                        maxVideoChannelUsers: 25,
                        approximateMemberCount: null,
                        approximatePresenceCount: null,
                        vanityURLUses: null,
                        rulesChannelId: null,
                        publicUpdatesChannelId: null,
                        preferredLocale: 'en-US',
                        ownerId: '756222140524658810',
                    },
                    joinedTimestamp: 1644589449863,
                    premiumSinceTimestamp: 1644590643837,
                    nickname: 'カーラ',
                    pending: false,
                    communicationDisabledUntilTimestamp: null,
                    _roles: [
                        '941703723774791680',
                        '941717032515301426',
                        '1009957459441487892',
                        '941702832170610709',
                    ],
                    user: {
                        id: '756222140524658810',
                        bot: false,
                        system: false,
                        username: 'Bot',
                        discriminator: '8371',
                        avatar: '25c59f6fabd49e80d7cb3f4c26942b6f',
                        banner: undefined,
                        accentColor: undefined,
                    },
                    avatar: null,
                },
                version: 1,
                appPermissions: { bitfield: 4398046511103n },
                memberPermissions: { bitfield: 4398046511103n },
                locale: 'en-US',
                guildLocale: 'en-US',
                commandId: '1025075091731652708',
                commandName: 'shuffle',
                commandType: 1,
                commandGuildId: null,
                deferred: false,
                replied: false,
                ephemeral: null,
                webhook: { id: '1024250006800183396' },
                options: {
                    _group: null,
                    _subcommand: null,
                    _hoistedOptions: [],
                },
            };
            await client.emit('interactionCreate', stopInteraction);
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .post("/api/skipto", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const queue = client.queues.get(client.currentChannel.guild.id);

        const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
        if (!oldConnection) {
            res.status(406).send("");
            return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);
        }


        if (!queue) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing playing right now**`).catch(() => null);
        }

        if (!queue.tracks || queue.tracks.length <= 1) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing to skip**`).catch(() => null);
        }
        const arg = req.body.queuePos;

        if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
            res.status(406).send("");
            return channel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't skip to ${arg}th Song.**` });
        }

        if (queue.queueloop) {
            for (let i = 1; i <= arg - 1; i++) {
                queue.tracks.push(queue.tracks[i]);
            }
        }

        queue.tracks = queue.tracks.slice(arg - 1);

        oldConnection.state.subscription.player.stop();
        res.status(200).send("OK");
        return channel.send(`⏭️ **Successfully skipped ${arg} Track(s)**`).catch(() => null);
    })
    .post("/api/remove", async (req, res) => {

        const channel = await client.channels.fetch(base_channelId);

        const queue = client.queues.get(client.currentChannel.guild.id);

        const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
        if (!oldConnection) {
            res.status(406).send("");
            return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);
        }


        if (!queue) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing playing right now**`).catch(() => null);
        }

        if (!queue.tracks || queue.tracks.length <= 1) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing to remove**`).catch(() => null);
        }
        const arg = req.body.queuePos;

        if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
            res.status(406).send("");
            return channel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${arg}th Song.**` });
        }

        queue.skipped = true;

        queue.tracks.splice(arg, 1);

        res.status(200).send("OK");
        return channel.send(`⏭️ **Successfully removed track number ${arg}**`).catch(() => null);
    })
    .post("/api/play", async (req, res) => {
        try {
            const channel = await client.channels.fetch(base_channelId);
            let queue = client.queues.get(client.currentChannel.guild.id);
            const oldConnection = getVoiceConnection(client.currentChannel.guild.id);

            const args = req.body.songs.split(" ");
            const track = args.join(' ');

            const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
            const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
            const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;

            let song = null;
            let playList = null;

            const isYoutube = youtubRegex.exec(track);
            const isYoutubeSong = songRegex.exec(track);
            const isYoutubePlaylist = playlistRegex.exec(track);

            if (!oldConnection) {
                try {
                    await client.joinVoiceChannel(client.currentChannel.guild.id);
                }
                catch (err) {
                    console.log(err);
                    res.status(406).send("");
                    return await channel.send({ content: `Could not join Voice Channel!` }).catch(() => null);
                }
            }

            await channel.send({ content: `Searching ${track} ...` });
            if (!oldConnection && queue) {
                client.queues.delete(client.currentChannel.guild.id);
                queue = undefined;
            }
            if (isYoutube && isYoutubeSong && !isYoutubePlaylist) {
                song = await YouTube.getVideo(track);
            }
            else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) {
                playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch());
            }
            else if (isYoutube && isYoutubePlaylist && isYoutubeSong) {
                song = await YouTube.getVideo(track);
                playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch());
            }
            else {
                song = await YouTube.searchOne(track);
            }
            if (song === null && playList === null) {
                console.log('[LOG] No songs were found!'.yellow);
                channel.send({ content: `No song were found!` });
                res.status(200).send("no songs found");
                return;
            }
            if (!playList) {
                if (!queue || queue.tracks.length == 0) {
                    const bitrate = 128;
                    const newQueue = client.createQueue(song, req.body.user, client.currentChannel.guild.id, bitrate);
                    client.queues.set(client.currentChannel.guild.id, newQueue);
                    await client.playSong(client.currentChannel, song);

                    res.status(200).send("OK");
                    return channel.send({ content: `Now playing : ${song.title} - ${song.durationFormatted}!` });
                }
                queue.tracks.push(client.createSong(song, req.body.user));
            }
            else {
                song = song ? song : playList.videos[0];
                const index = playList.videos.findIndex(s => s.id == song.id) || 0;
                playList.videos.splice(0, index + 1);

                if (!queue || queue.tracks.length == 0) {
                    const bitrate = 128;
                    const newQueue = client.createQueue(song, req.body.user, client.channelId, bitrate);
                    playList.videos.forEach(nsong => newQueue.tracks.push(client.createSong(nsong, req.body.user)));
                    client.queues.set(client.currentChannel.guild.id, newQueue);

                    await client.playSong(client.currentChannel, song);

                    res.status(200).send("OK");
                    return channel.send({ content: `Now playing : ${song.title} - ${song.durationFormatted} - from playlist: ${playList.title}` });
                }

                playList.videos.forEach(nsong => queue.tracks.push(client.createSong(nsong, req.body.user)));

                res.status(200).send("OK");
                return channel.send(`Queued at \`${client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${song.title} - \`${song.durationFormatted}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`);
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).send("OK");
        }
    })
    .post("/api/playfirst", async (req, res) => {
        try {
            const channel = await client.channels.fetch(base_channelId);
            const queue = client.queues.get(client.currentChannel.guild.id);

            const args = req.body.songs.split(" ");
            const track = args.join(' ');

            const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
            const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
            const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;

            let song = null;
            let playlist = null;

            const isYT = youtubRegex.exec(track);
            const isSong = songRegex.exec(track);
            const isList = playlistRegex.exec(track);

            await channel.send(`🔍 *Searching **${track}** ...*`);
            // get song from the link
            if (isYT && isSong && !isList) {
                song = await YouTube.getVideo(track);
            }
            // get playlist from the link
            else if (isYT && !isSong && isList) {
                playlist = await YouTube.getPlaylist(track).then(() => playlist.fetch());
            }
            // get playlist & song from the link
            else if (isYT && isSong && isList) {
                song = await YouTube.getVideo(`https://www.youtube.com/watch?v=${isSong[2]}`);
                playlist = await YouTube.getPlaylist(`https://www.youtube.com/playlist?list=${isList[2]}`).then(() => playlist.fetch());
            }
            // otherwise search for it
            else {
                song = await YouTube.searchOne(track);
            }
            if (!song && !playlist) return channel.send(`❌ **Failed looking up for ${track}!**`);
            /* FOR NO PLAYLIST REQUESTS */
            if (!playlist) {
                // Add the song to the queue
                if (!queue) {

                    res.status(406).send("No queue");
                    return channel.send({ content: `❗ No queue bitch!` });
                }
                queue.tracks = [queue.tracks[0], client.createSong(song, req.body.user), ...queue.tracks.slice(1)];
                // edit the loading message
                return channel.send(`▶️ **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\``);
            }
            /* FOR PLAYLIST REQUEST */
            else {
                // get the song, or the first playlist song
                song = song ? song : playlist.videos[0];
                // remove the song which got added
                const index = playlist.videos.findIndex(s => s.id == song.id) || 0;
                playlist.videos.splice(index, 1);
                const playlistSongs = [];
                // Add the playlist songs to the queue
                playlist.videos.forEach(nsong => playlistSongs.push(client.createSong(nsong, req.body.user)));
                queue.tracks = [queue.tracks[0], client.createSong(song, req.body.user), ...playlistSongs, ...queue.tracks.slice(1)];
                // edit the loading message
                await channel.send(`👍 **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\`\n> **Added \`${playlist.videos.length - 1} Songs\` from the Playlist:**\n> __**${playlist.title}**__`);
                res.status(200).send("OK");
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).send("OK");
        }
    })
    .post("/api/filters", async (req, res) => {
        console.log(req.body);

        const channel = await client.channels.fetch(base_channelId);

        const queue = client.queues.get(client.currentChannel.guild.id);

        const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
        if (!oldConnection) return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);

        if (queue.size === 0) return channel.send({ content: `👎 **I'm nothing playing right now.**` }).catch(() => null);

        try {
            const filters = req.body;
            queue.effects = filters;
            queue.filtersChanged = true;

            const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;
            oldConnection.state.subscription.player.stop();
            oldConnection.state.subscription.player.play(client.getResource(queue, queue.tracks[0].id, curPos));

            channel.send({
                content: `Changed filters to:\n`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("FUCHSIA")
                        .setTitle("Current Filters")
                        .setDescription(Object.keys(queue.effects)
                            .filter(o => o != "bassboost" && o != "speed")
                            .map(option => `> **\`${option.charAt(0).toUpperCase()}${option.slice(1)}\`** - ${queue.effects[option] ? `✅ Enabled` : `❌ Disabled:`}`).join("\n\n"))
                        .addFields(
                            Object.keys(queue.effects).filter(o => o == "bassboost" || o == "speed")
                                .map(option => ({ name: `> **\`${option.charAt(0).toUpperCase()}${option.slice(1)}\`**`, value: `${queue.effects[option]}`, inline: true })),
                        ),
                ],
            });
            res.status(200).send("OK");
        }
        catch (err) {
            console.log(err);
            res.status(500).send(err);
        }


    })
    .get("/api/fetchqueue", (req, res) => {
        try {
            let oldConnection;
            let curPos = 0;
            if (client.currentChannel) oldConnection = getVoiceConnection(client.currentChannel.guild.id);
            if (oldConnection && client.queues.size !== 0 && client.queues.get(client.currentChannel.guild.id).size !== 0) curPos = oldConnection.state.subscription.player.state.resource?.playbackDuration;
            const data = {
                queue: client.queues,
                prog: curPos,
                formatedprog: client.formatDuration(curPos),
            };
            // console.log(client);
            res.send(data);
        }
        catch (err) {
            console.log(err);
            res.end();
        }

    })
    .post("/api/login", async (req, res) => {
        if (!req.body || !req.body.code) return res.status(406).send("no code");


        try {
            const params = new URLSearchParams();
            params.append('client_id', "1028294291698765864");
            params.append('client_secret', 'PQI01KT2dwee50HuE853-AJg_i1uE-nW');
            params.append('grant_type', 'authorization_code');
            params.append('code', String(req.body.code));
            params.append('redirect_uri', `https://music.afterlifehorizon.net/`);
            params.append('scope', 'identify');
            console.log(params.toString());
            const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: params.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (tokenResponseData.statusCode === 401) return res.status(406).send(tokenResponseData.body);

            const oauthData = await getJSONResponse(tokenResponseData.body);
            res.status(200).json(oauthData);
        }
        catch (error) {
            console.error(error);
            res.status(500).send("Internal Error");
        }
    })
    .post("/api/loginaccess", async (req, res) => {
        if (!req.body || !req.body.access_token) return res.status(406).send("no code");

        try {

            const userResult = await request('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${req.body.token_type} ${req.body.access_token}`,
                },
            });
            res.status(200).json(await getJSONResponse(userResult.body));
        }
        catch (error) {
            // NOTE: An unauthorized token will not throw an error
            // tokenResponseData.statusCode will be 401
            console.error(error);

            res.status(500).send("Internal Error");
        }
    })
    .use(
        connectHistoryApiFallback({
            verbose: false,
        }),
    )
    .use(express.static(path.join(__dirname, "../webapp/frontend/build")))
    .listen(port, () => console.log(`Listening on port ${port}`.toUpperCase().white.bgGreen.bold));


// --------- Loging in bot ---------
client.login(client.config.token);