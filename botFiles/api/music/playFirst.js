const express = require("express");
const router = express.Router();
module.exports = function (client) {
    return (
        router.post("/", async (req, res) => {
            try {
                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
                const connectedMembers = await guild.members.cache.filter(member => member.voice.channel);
                const requester = connectedMembers.filter((member) => member.user.username === req.body.user);
                const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0);

                if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!");
                else if (client.user.id !== voiceChannel.id) return res.status(406).send("Not the same channel!");

                if (!client.currentChannel) return res.status(406).send("not connected!");
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
    );
}