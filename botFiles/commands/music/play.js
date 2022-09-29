/* eslint-disable no-useless-escape */
const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");
const { default: YouTube } = require('youtube-sr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a youtube video/song!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Enter a song or a playlist!')
                .setRequired(true)),
    async execute(interaction) {
        console.log('Play command executed!'.yellow);
        try {
            const oldConnection = getVoiceConnection(interaction.guild.id);
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) {
                console.log('User is not in the same channel!'.yellow);
                return await interaction.reply({ content: `We are not in the same channel: I'm in <#${oldConnection.joinConfig.channelId}>!` });
            }
            if (!interaction.member.voice.channelId) return await interaction.reply({ content: `Please join a voice channel first` });

            const args = interaction.options.getString('song').split(" ");
            const track = args.join(' ');
            if (!args[0]) return interaction.reply(`Please add the wished music via /play <name/link>`);

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
                    await interaction.client.joinVoiceChannel(interaction.member.voice.channel);
                }
                catch (err) {
                    console.log(err);
                    return await interaction.reply({ content: `Could not join Voice Channel!` }).catch(() => null);
                }
            }

            await interaction.reply({ content: `Searching ${track} ...` });
            let queue = interaction.client.queues.get(interaction.guild.id);
            if (!oldConnection && queue) {
                interaction.client.queues.delete(interaction.guild.id);
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
                interaction.editReply({ content: `No song were found!` });
                return;
            }
            if (!playList) {
                if (!queue || queue.tracks.length == 0) {
                    const bitrate = 128;
                    const newQueue = interaction.client.createQueue(song, interaction.user, interaction.channelId, bitrate);
                    interaction.client.queues.set(interaction.guild.id, newQueue);
                    await interaction.client.playSong(interaction.member.voice.channel, song);

                    return interaction.editReply({ content: `Now playing : ${song.title} - ${song.durationFormatted}!` }).catch(() => null);
                }
                queue.tracks.push(interaction.client.createSong(song, interaction.user));
            }
            else {
                song = song ? song : playList.videos[0];
                const index = playList.videos.findIndex(s => s.id == song.id) || 0;
                playList.videos.splice(index, 1);

                if (!queue || queue.tracks.length == 0) {
                    const bitrate = 128;
                    const newQueue = interaction.client.createQueue(song, interaction.user, interaction.channelId, bitrate);
                    playList.videos.forEach(nsong => newQueue.tracks.push(interaction.client.createSong(nsong, interaction.user)));
                    interaction.client.queues.set(interaction.guild.id, newQueue);

                    await interaction.client.playSong(interaction.member.voice.channel, song);

                    return interaction.editReply({ content: `Now playing : ${song.title} - ${song.durationFormatted} - from playlist: ${playList.title}` }).catch(() => null);
                }

                playList.videos.forEach(nsong => queue.tracks.push(interaction.client.createSong(nsong, interaction.user)));

                return interaction.editReply(`Queued at \`${interaction.client.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${song.title} - \`${song.durationFormatted}\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`).catch(() => null);
            }
        }
        catch (err) {
            console.log(err);
            console.log("[LOG] Could not play the Song!".red);
            return;
        }
    },
};