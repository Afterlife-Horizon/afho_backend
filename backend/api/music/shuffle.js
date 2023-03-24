const express = require("express");
const router = express.Router();

module.exports = function (client) {
    return (
        router.post("/", async (req, res) => {
            const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
            const connectedMembers = await guild.members.cache.filter(member => member.voice.channel);
            const requester = connectedMembers.filter((member) => member.user.username === req.body.user);
            const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0);
    
            if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!");
            else if (voiceChannel.id !== client.currentChannel.id) return res.status(406).send("Not the same channel!");
    
            if (!client.currentChannel) return res.status(406).send("not connected!");
    
            const channel = await client.channels.fetch(client.config.baseChannelId);
    
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
                res.status(500).send(err);
            }
        })
    );
}