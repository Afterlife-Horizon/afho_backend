import express = require("express");
const router = express.Router();
import { AudioPlayerBufferingState, AudioPlayerIdleState, AudioPlayerPausedState, AudioPlayerPlayingState, AudioPlayerState, VoiceConnection, VoiceConnectionConnectingState, VoiceConnectionDisconnectedState, VoiceConnectionReadyState, VoiceConnectionSignallingState, VoiceConnectionState, getVoiceConnection } from "@discordjs/voice";
import BotClient from "../../../botClient/BotClient";

export default function (client: BotClient) {
    return (
        router.get("/", async (req, res) => {
            try {
                if (!client.ready) return res.status(406).send("Loading!");
                const guild = client.guilds.cache.find(g => g.name === client.config.serverName);
                if (!guild) return res.status(406).send("Server not found!");

                await guild.members.fetch();
                const admins = guild.roles.cache.find(r => r.name === "admin")?.members;
    
                if (!admins) return res.status(406).send("Admins not found!");

                const queue = client.queues.get(guild.id);
                
                let curPos = 0;
                
                let oldConnection: VoiceConnection | undefined;
                const currentChannel = client.currentChannel;
                if (currentChannel) oldConnection = getVoiceConnection(currentChannel.guild.id);

                const state = oldConnection?.state as VoiceConnectionSignallingState | VoiceConnectionDisconnectedState | VoiceConnectionConnectingState | VoiceConnectionReadyState;
                const ressource = (state?.subscription?.player.state as AudioPlayerBufferingState | AudioPlayerPlayingState | AudioPlayerPausedState)?.resource;

                if (oldConnection && client.queues.size !== 0 && queue) curPos = ressource ? ressource.playbackDuration : 0
                const data = {
                    queue: client.queues,
                    prog: curPos,
                    formatedprog: client.formatDuration(curPos),
                    admins: {
                        admins: admins.map(admin => [admin.user, admin]),
                        usernames: admins.map(admin => admin.user.username),
                    },
                };
                
                res.send(data);
            }
            catch (err) {
                console.log(err);
                res.end();
            }
        })
    );
}