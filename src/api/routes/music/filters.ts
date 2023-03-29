import express = require("express");
const router = express.Router();
import { Colors, EmbedBuilder, TextChannel, VoiceChannel } from "discord.js";
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import BotClient from "../../../botClient/BotClient";
import { IEffects } from "../../../types";

export default function (client: BotClient) {
    return (
        router.post("/", async (req, res) => {
            const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
            if (!guild) return res.status(406).send("Guild not found!");

            const connectedMembers = guild.members.cache.filter(member => member.voice.channel);
            const requester = connectedMembers.filter((member) => member.user.username === req.body.user);
            const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0) as VoiceChannel;
            if (!voiceChannel) return res.status(406).send("You are not connected to a voice channel!");

            if (!client.currentChannel) return res.status(406).send("Bot not playing!");

            if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!");
            else if (voiceChannel.id !== client.currentChannel.id) return res.status(406).send("Not the same channel!");

            const channel = await client.channels.fetch(client.config.baseChannelId) as TextChannel;
            if (!channel) return res.status(406).send("Text Channel not found!");

            const queue = client.queues.get(client.currentChannel.guild.id);
            if (!queue) return channel.send({ content: `👎 **I'm nothing playing right now.**` }).catch((err) => console.log(err));

            const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
            if (!oldConnection) return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch((err) => console.log(err));

            if (queue.tracks.length === 0) return channel.send({ content: `👎 **I'm nothing playing right now.**` }).catch((err) => console.log(err));

            try {
                const filters = req.body.filters as IEffects;
                queue.effects = filters;
                queue.filtersChanged = true;

                const state = oldConnection.state as VoiceConnectionReadyState;
                if (!state || !state.subscription) return res.status(400).send(`👎 **Something went wrong**`);

                const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
                if (!playerState || !playerState.resource) return res.status(400).send(`👎 **Something went wrong**`);        


                const curPos = playerState.resource.playbackDuration;
                state.subscription.player.stop();
                state.subscription.player.play(client.getResource(queue, queue.tracks[0].id, curPos));

                channel.send({
                    content: `Changed filters to:\n`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Fuchsia)
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