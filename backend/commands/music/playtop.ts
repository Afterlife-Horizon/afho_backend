/* eslint-disable no-useless-escape */
import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { default as YouTube } from 'youtube-sr';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playtop')
        .setDescription('Plays Music in your Voice Channel and positions it to the queue top')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Enter a youtube link or a song name!')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));

        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));
        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
        }
        const track = interaction.options.getString("song");
        if (!track) return interaction.reply(`👎 Please add the wished Music via: \`/playtop <Name/Link>\``).catch((err) => console.log(err));
        // Regexpressions for testing the search string
        const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
        const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
        const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;
        // variables for song, and playlist
        let song = null;
        let playlist = null;
        // Use the regex expressions
        const isYT = youtubRegex.exec(track);
        const isSong = songRegex.exec(track);
        const isList = playlistRegex.exec(track);

        try {
            // try to play the requested song
            await interaction.reply(`🔍 *Searching **${track}** ...*`).catch((err) => console.log(err));
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
            if (!song && !playlist) return interaction.editReply(`❌ **Failed looking up for ${track}!**`);
            /* FOR NO PLAYLIST REQUESTS */
            if (!playlist) {
                // Add the song to the queue
                queue.tracks = [queue.tracks[0], interaction.client.createSong(song, interaction.user), ...queue.tracks.slice(1)];
                // edit the loading message
                return interaction.editReply(`▶️ **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\``).catch((err) => console.log(err));
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
                playlist.videos.forEach(nsong => playlistSongs.push(interaction.client.createSong(nsong, interaction.user)));
                queue.tracks = [queue.tracks[0], interaction.client.createSong(song, interaction.user), ...playlistSongs, ...queue.tracks.slice(1)];
                // edit the loading message
                return interaction.editReply(`👍 **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\`\n> **Added \`${playlist.videos.length - 1} Songs\` from the Playlist:**\n> __**${playlist.title}**__`).catch((err) => console.log(err));
            }

        }
        catch (e) {
            console.error(e);
            return interaction.reply(`❌ Could not play the Song because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\``).catch((err) => console.log(err));
        }
    },
};