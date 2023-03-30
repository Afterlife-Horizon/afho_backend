import express = require("express");
const router = express.Router();
import { Playlist, Video, default as YouTube } from 'youtube-sr';
import BotClient from "../../../botClient/BotClient";
import { TextChannel, VoiceChannel } from "discord.js";
import { IESong } from "../../../types";

export default function (client : BotClient) {
    return (
        router.post("/", async (req, res) => {
            try {
                const guild = client.guilds.cache.find(g => g.name === client.config.serverName);
                if (!guild) return res.status(406).send("Guild not found!");
                await guild.members.fetch();
                await guild.channels.fetch();
                const connectedMembers = guild.members.cache.filter(member => member.voice.channel);
                const requester = connectedMembers.filter((member) => member.user.username === req.body.user);
                const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size > 0);

                if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!");
                else if (client.currentChannel?.id !== voiceChannel?.id) return res.status(406).send("Not the same channel!");

                if (!client.currentChannel) return res.status(406).send("not connected!");
                const currentChannel = await client.channels.fetch(client.currentChannel.id) as VoiceChannel | TextChannel;
                
                const channel = await client.channels.fetch(client.config.baseChannelId) as VoiceChannel | TextChannel;
                const queue = client.queues.get(currentChannel.guild.id);


                if (!queue) return res.status(406).send("No queue found!");
                const track = req.body.songs;

                const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
                const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
                const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;

                let song : Video | undefined = undefined;
                let playlist : Playlist | undefined = undefined;

                const isYT = youtubRegex.exec(track);
                const isSong = songRegex.exec(track);
                const isList = playlistRegex.exec(track);

                await channel.send(`🔍 *Searching **${track}** ...*`);
                if (isYT && isSong && !isList) {
                    song = await YouTube.getVideo(track);
                }
                else if (isYT && !isSong && isList) {
                    playlist = await YouTube.getPlaylist(track).then(p => p.fetch());
                }
                else if (isYT && isSong && isList) {
                    song = await YouTube.getVideo(`https://www.youtube.com/watch?v=${isSong[2]}`);
                    playlist = await YouTube.getPlaylist(`https://www.youtube.com/playlist?list=${isList[2]}`).then(p => p.fetch());
                }
                else {
                    song = await YouTube.searchOne(track);
                }
                if (!song && !playlist) return channel.send(`❌ **Failed looking up for ${track}!**`);
                if (!playlist) {
                    const video = song as Video;
                    if (!queue) {
                        res.status(406).send("No queue");
                        return channel.send({ content: `❗ No queue!` });
                    }
                    queue.tracks = [queue.tracks[0], client.createSong(video, req.body.user), ...queue.tracks.slice(1)];
                    return channel.send(`▶️ **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\``);
                }
                else {
                    song = song ? song : playlist.videos[0];

                    const video = song as Video;
                    const index = playlist.videos.findIndex(s => s.id == video.id) || 0;
                    playlist.videos.splice(index, 1);
                    const playlistSongs : IESong[] = [];
                    playlist.videos.forEach(nsong => playlistSongs.push(client.createSong(nsong, req.body.user)));
                    queue.tracks = [queue.tracks[0], client.createSong(video, req.body.user), ...playlistSongs, ...queue.tracks.slice(1)];
                    await channel.send(`👍 **Queued at \`1st\`: __${video.title}__** - \`${video.durationFormatted}\`\n> **Added \`${playlist.videos.length - 1} Songs\` from the Playlist:**\n> __**${playlist.title}**__`);
                    res.status(200).send("OK");
                }
            }
            catch (err) {
                console.log(err);
                res.status(500).send("OK");
            }
        })
    );
}