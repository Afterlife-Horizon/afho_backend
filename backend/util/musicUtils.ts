import Discord = require('discord.js');
import dcYtdl = require("discord-ytdl-core");
import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, createAudioResource, createAudioPlayer, NoSubscriberBehavior, entersState, CreateAudioResourceOptions, AudioPlayer } from "@discordjs/voice";
import { IClient, ISong } from '../types';
import { User } from 'discord.js';

module.exports = (client: IClient) => {
    const m2 = (t) => parseInt(t) < 10 ? `0${t}` : `${t}`;
    const m3 = (t) => parseInt(t) < 100 ? `0${m2(t)}` : `${t}`;

    /**
     * 
     * @param ms time in milliseconds
     * @returns string of the given time in minutes:seconds format 
     */
    client.formatDuration = (ms: number) => {
        let sec = Math.floor(ms / 1000 % 60);
        let min = Math.floor(ms / (1000 * 60) % 60);
        const hrs = Math.floor(ms / (1000 * 60 * 60) % 24);
        if (sec >= 60) sec = 0;
        if (min >= 60) min = 0;
        if (hrs > 1) return `${m2(hrs)}:${m2(min)}:${m2(sec)}`;
        return `${m2(min)}:${m2(sec)}`;
    };

    /**
     * 
     * @param duration duration of the song
     * @param position current position of the song
     * @returns a string with the progress bar
     */
    client.createBar = (duration: number, position: number) => {
        const full = "▰";
        const empty = "▱";
        const size = "▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱".length;
        const percent = duration == 0 ? null : Math.floor(position / duration * 100);
        const fullBars = Math.round(size * (percent / 100));
        const emptyBars = size - fullBars;
        return `**${full.repeat(fullBars)}${empty.repeat(emptyBars)}**`;
    };

    /**
     * 
     * @returns string of the current time in hours:minutes:seconds.milliseconds format
     */
    client.getTime = () => {
        const date = new Date;
        return `${m2(date.getHours())}:${m2(date.getMinutes())}:${m2(date.getSeconds())}.${m3(date.getMilliseconds())}`;
    };

    /**
     * 
     * @param id youtube video id
     * @returns the youtube link of the given id
     */
    client.getYTLink = (id: number) => {
        return `https://www.youtube.com/watch?v=${id}`;
    };

    /**
     * 
     * @param channel voice channel to join
     * @returns a promise that resolves when the bot joins the voice channel
     */
    client.joinVoiceChannel = async (channel) => {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id);
            if (oldConnection) return rej("I'm already connected in: <#" + oldConnection.joinConfig.channelId + ">");
            const newConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            delay(250);

            newConnection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(newConnection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(newConnection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                }
                catch (error) {
                    newConnection.destroy();
                }
            });

            newConnection.on(VoiceConnectionStatus.Destroyed, () => {
                client.queues?.delete(channel.guild.id);
            });

            return res("Connected to the Voice Channel");
        });
    };

    /**
     * 
     * @param channel voice channel to leave
     * @returns a promise that resolves when the bot leaves the voice channel
     */
    client.leaveVoiceChannel = async (channel) => {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id);
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!");
                try {
                    oldConnection.destroy();
                    delay(250);
                    return res(true);
                }
                catch (e) {
                    return rej(e);
                }
            }
            else {
                return rej("I'm not connected somwhere.");
            }
        });
    };

    /**
     * 
     * @param queue queue of the guild
     * @param songInfoId id of the song
     * @param seekTime time to seek to
     * @returns a discord audio resource
     */
    client.getResource = (queue, songInfoId, seekTime = 0) => {
        let Qargs = "";
        const effects = queue?.effects;

        if (effects.normalizer) Qargs += `,dynaudnorm=f=200`;
        if (effects.bassboost) Qargs += `,bass=g=${effects.bassboost}`;
        if (effects.speed) Qargs += `,atempo=${effects.speed}`;
        if (effects["3d"]) Qargs += `,apulsator=hz=0.03`;
        if (effects.subboost) Qargs += `,asubboost`;
        if (effects.mcompand) Qargs += `,mcompand`;
        if (effects.haas) Qargs += `,haas`;
        if (effects.gate) Qargs += `,agate`;
        if (effects.karaoke) Qargs += `,stereotools=mlev=0.03`;
        if (effects.flanger) Qargs += `,flanger`;
        if (effects.pulsator) Qargs += `,apulsator=hz=1`;
        if (effects.surrounding) Qargs += `,surround`;
        if (effects.vaporwave) Qargs += `,aresample=48000,asetrate=48000*0.8`;
        if (effects.nightcore) Qargs += `,aresample=48000,asetrate=48000*1.5`;
        if (effects.phaser) Qargs += `,aphaser=in_gain=0.4`;
        if (effects.tremolo) Qargs += `,tremolo`;
        if (effects.vibrato) Qargs += `,vibrato=f=6.5`;
        if (effects.reverse) Qargs += `,areverse`;
        if (effects.treble) Qargs += `,treble=g=5`;
        if (Qargs.startsWith(",")) Qargs = Qargs.substring(1);


        const requestOpts = {
            requestOptions: {},
            fmt: "mp3",
            highWaterMark: 1 << 62,
            liveBuffer: 1 << 62,
            dlChunkSize: 0,
            seek: Math.floor(seekTime / 1000),
            bitrate: queue?.bitrate || 128,
            quality: "highestaudio",
            encoderArgs: Qargs ? ["-af", Qargs] : ['-af', 'bass=g=2,dynaudnorm=f=200'],
        };

        if (client.config?.YOUTUBE_LOGIN_COOKIE && client.config.YOUTUBE_LOGIN_COOKIE.length > 10) {
            requestOpts.requestOptions = {
                headers: {
                    cookie: client.config.YOUTUBE_LOGIN_COOKIE,
                },
            };
        }

        if (!client.getYTLink) return;
        const resource = createAudioResource(dcYtdl(client.getYTLink(songInfoId), requestOpts), {
            inlineVolume: true,
        });

        const volume = queue && queue.volume && queue.volume <= 150 && queue.volume >= 1 ? (queue.volume / 100) : 1;
        resource.volume?.setVolume(volume);
        resource.playbackDuration = seekTime;
        return resource;
    };

    /**
     * 
     * @param channel voice channel to play in
     * @param songInfo song to play
     * @returns a promise that resolves when the song is played
     */
    client.playSong = async (channel, songInfo) => {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guildId);
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!");
                try {
                    const curQueue = client.queues.get(channel.guildId);

                    const player = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Stop,
                        },
                    });
                    oldConnection.subscribe(player);

                    const resource = client.getResource(curQueue, songInfo.id);
                    // play the resource
                    player.play(resource);

                    // When the player plays a new song
                    player.on("playing", () => {
                        const queue = client.queues.get(channel.guildId);
                        // if filters changed, don't send something
                        if (queue && queue.filtersChanged) {
                            queue.filtersChanged = false;
                        }
                        else {
                            client.sendQueueUpdate? client.sendQueueUpdate(channel.guildId) : null;
                        }

                    });
                    // When the player goes on idle
                    player.on("idle", () => {
                        const queue = client.queues.get(channel.guildId);
                        handleQueue(client, player, queue);
                    });
                    // when an error happens
                    player.on('error', error => {
                        console.error(error);
                        const queue = client.queues?.get(channel.guildId);
                        handleQueue(client, player, queue);
                    });
                    return res(songInfo);
                }
                catch (e) {
                    return rej(e);
                }
            }
            else {
                return rej("I'm not connected somwhere.");
            }
        });

    };

    /**
     * Sends an update to the queue
     * @param guildId id of the guild
     * @returns true
     */
    client.sendQueueUpdate = async (guildId) => {
        const queue = client.queues.get(guildId);
        if (!queue || !queue.tracks || queue.tracks.length == 0 || !queue.textChannel) return false;
        const textChannel = client.channels.cache.get(queue.textChannel) || await client.channels.fetch(queue.textChannel).catch((err) => console.log(err));
        if (!textChannel) return false;
        const song = queue.tracks[0];

        const songEmbed = new Discord.EmbedBuilder()
            .setColor("FUCHSIA")
            .setTitle(`${song.title}`)
            .setURL(client.getYTLink(song.id))
            .addFields(
                { name: `**Duration:**`, value: `> \`${song.durationFormatted}\``, inline: true },
                { name: `**Requester:**`, value: `> ${song.requester}`, inline: true },
            );
        if (song?.thumbnail?.url) songEmbed.setImage(`${song?.thumbnail?.url}`);

        textChannel.send({
            embeds: [
                songEmbed,
            ],
        }).catch(console.warn);
        return true;
    };

    /**
     * 
     * @param song song to create
     * @param requester requester of the song
     * @returns the song with the requester
     */
    client.createSong = (song: ISong, requester: IDiscordUser) => {
        return { ...song, requester };
    };

    /**
     * 
     * @param length length of the queue
     * @returns the position in the queue
     */
    client.queuePos = (length: number) => {
        const str: { [key: number]: string } = {
            1: "st",
            2: "nd",
            3: "rd",
        };
        return `${length}${str[length % 10] ? str[length % 10] : "th"}`;
    };

    /**
     * 
     * @param song song to create a queue for
     * @param user user who requested the song
     * @param channelId channel to send the queue to
     * @param bitrate bitrate of the song
     * @returns a queue
     */
    client.createQueue = (song: ISong, user: User, channelId: string, bitrate = 128) => {
        return {
            textChannel: channelId,
            paused: false,
            skipped: false,
            effects: {
                bassboost: 0,
                subboost: false,
                mcompand: false,
                haas: false,
                gate: false,
                karaoke: false,
                flanger: false,
                pulsator: false,
                surrounding: false,
                "3d": false,
                vaporwave: false,
                nightcore: false,
                phaser: false,
                normalizer: false,
                speed: 1,
                tremolo: false,
                vibrato: false,
                reverse: false,
                treble: false,
            },
            trackloop: false,
            queueloop: false,
            filtersChanged: false,
            volume: 15,
            tracks: [client.createSong? client.createSong(song, user) : { ...song, requester: user }],
            previous: undefined,
            creator: user,
            bitrate: bitrate,
        };
    };
};

/**
 * 
 * @param ms time to delay
 * @returns a promise that resolves after the time
 */
function delay(ms: number) {
    return new Promise(r => setTimeout(() => r(2), ms));
}

/**
 * handle the queue
 * @param client client to use
 * @param player player to use
 * @param queue queue to use
 */
async function handleQueue(client: IClient, player: AudioPlayer, queue) {
    if (queue && !queue.filtersChanged) {
        try {
            player.stop();
            if (queue && queue.tracks && queue.tracks.length > 1) {
                queue.previous = queue.tracks[0];
                if (queue.trackloop && !queue.skipped) {
                    if (queue.paused) queue.paused = false;
                    player.play(client.getResource(queue, queue.tracks[0].id));
                }
                else if (queue.queueloop && !queue.skipped) {
                    const skipped = queue.tracks.shift();
                    queue.tracks.push(skipped);
                    if (queue.paused) queue.paused = false;
                    player.play(client.getResource(queue, queue.tracks[0].id));
                }
                else {
                    if (queue.skipped) queue.skipped = false;
                    if (queue.paused) queue.paused = false;
                    queue.tracks.shift();
                    player.play(client.getResource(queue, queue.tracks[0].id));
                }
            }
            else if (queue && queue.tracks && queue.tracks.length <= 1) {
                queue.previous = queue.tracks[0];
                if (queue.trackloop || queue.queueloop && !queue.skipped) {
                    player.play(client.getResource(queue, queue.tracks[0].id));
                }
                else {
                    if (queue.skipped) queue.skipped = false;
                    queue.tracks = [];
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    }
}