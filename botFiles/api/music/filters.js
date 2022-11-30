const express = require("express");
const router = express.Router();
const {EmbedBuilder} = require("discord.js");
const {getVoiceConnection} = require("@discordjs/voice");

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
            // console.log(req.body);

            const channel = await client.channels.fetch(client.config.baseChannelId);

            const queue = client.queues.get(client.currentChannel.guild.id);

            const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
            if (!oldConnection) return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);

            if (queue.size === 0) return channel.send({ content: `👎 **I'm nothing playing right now.**` }).catch(() => null);

            try {
                const filters = req.body.filters;
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
    );
}