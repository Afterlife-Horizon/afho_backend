import { AudioPlayer, AudioPlayerStatus, CreateVoiceConnectionOptions, JoinVoiceChannelOptions, NoSubscriberBehavior, StreamType, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice"
import { Client, ClientOptions, Collection, Colors, EmbedBuilder, TextChannel, User, VoiceChannel, VoiceState } from "discord.js"
import { ICommand, IQueue, IESong, IFavorite } from "../types"
import fs from "node:fs"
import path from "node:path"
import FFmpeg from 'fluent-ffmpeg';

import interactionCreate from "./listeners/interactionCreate"
import messageCreate from "./listeners/messageCreate"
import voiceStateUpdate from "./listeners/voiceStateUpdate"
import DBClient from "../DB/DBClient"
import { Video } from "youtube-sr"
import ytdl, { downloadOptions } from "ytdl-core"
import { Readable, Transform } from "stream"
import { PassThrough } from "node:stream"


export default class BotClient extends Client {
    public currentChannel: VoiceChannel | null;
    public dbClient: DBClient
    public config: {
        token: string;
        clientID: string;
        brasilChannelId: string;
        baseChannelId: string;
        openaiKey?: string;
        YOUTUBE_LOGIN_COOKIE?: string;
        serverName: string;
    };
    public commands: Map<string, ICommand>;
    public queues: Map<string, IQueue>;
    public favs: Map<string, IFavorite[]>;
    public ready: boolean;

    constructor(options: ClientOptions) {
        super(options)
        this.config = {
            token: process.env.TOKEN || "",
            clientID: process.env.CLIENT_ID || "",
            brasilChannelId: process.env.BRASIL_CHANNEL_ID || "",
            baseChannelId: process.env.BASE_CHANNEL_ID || "",
            openaiKey: process.env.OPENAI_KEY,
            YOUTUBE_LOGIN_COOKIE: process.env.YOUTUBE_LOGIN_COOKIE,
            serverName: process.env.SERVER_NAME || "",
        }
        this.commands = new Collection();
        this.queues = new Collection();
        this.favs = new Collection();
        this.ready = false;
        this.initCommands();
        this.initListeners();
        this.currentChannel = null;
        this.dbClient = new DBClient();
    }

    private initCommands() {
        const commandsPath = path.join(__dirname, "commands");
        fs.readdirSync(commandsPath).forEach((dir) => {
            const directorypath = path.join(commandsPath, dir);
            fs.readdirSync(directorypath)
                .filter((file) => file.endsWith(".js"))
                .forEach((file) => {
                    const filePath = path.join(directorypath, file);
                    const {default: commandFunction} = require(filePath);
                    const command = commandFunction(this);
                    this.commands.set(command.data.name, command);
                });
        });
    }

    private initListeners() {
        interactionCreate(this)
        messageCreate(this)
        voiceStateUpdate(this)
    }

    /**
     * 
     * @param ms time in milliseconds
     * @returns string of the given time in minutes:seconds format 
     */
    public formatDuration = (ms: number) => {
        let sec = Math.floor(ms / 1000 % 60);
        let min = Math.floor(ms / (1000 * 60) % 60);
        const hrs = Math.floor(ms / (1000 * 60 * 60) % 24);
        if (sec >= 60) sec = 0;
        if (min >= 60) min = 0;
        if (hrs > 1) return `${this.m2(hrs)}:${this.m2(min)}:${this.m2(sec)}`;
        return `${this.m2(min)}:${this.m2(sec)}`;
    };

    /**
     * 
     * @param duration duration of the song
     * @param position current position of the song
     * @returns a string with the progress bar
     */
    public createBar = (duration: number, position: number) => {
        const full = "▰";
        const empty = "▱";
        const size = "▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱".length;
        const percent = duration == 0 ? 0 : Math.floor(position / duration * 100);
        const fullBars = Math.round(size * (percent / 100));
        const emptyBars = size - fullBars;
        return `**${full.repeat(fullBars)}${empty.repeat(emptyBars)}**`;
    };

    /**
     * 
     * @returns string of the current time in hours:minutes:seconds.milliseconds format
     */
    public getTime = () => {
        const date = new Date;
        return `${this.m2(date.getHours())}:${this.m2(date.getMinutes())}:${this.m2(date.getSeconds())}.${this.m3(date.getMilliseconds())}`;
    };

    /**
     * 
     * @param id youtube video id
     * @returns the youtube link of the given id
     */
    public getYTLink = (id: string) => {
        return `https://www.youtube.com/watch?v=${id}`;
    };

    /**
     * 
     * @param channel voice channel to join
     * @returns a promise that resolves when the bot joins the voice channel
     */
    public joinVoiceChannel = async (channel: VoiceChannel) : Promise<string> => {
        const networkStateChangeHandler = (_: VoiceState, newNetworkState: VoiceState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id);
            if (oldConnection) return rej("I'm already connected in: <#" + oldConnection.joinConfig.channelId + ">");

            const options = {
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            } as (CreateVoiceConnectionOptions & JoinVoiceChannelOptions);

            const newConnection = joinVoiceChannel(options);

            this.delay(250);

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
                this.queues.delete(channel.guild.id);
            });

            newConnection.on('stateChange', (oldState, newState) => {
                const oldNetworking = Reflect.get(oldState, 'networking');
                const newNetworking = Reflect.get(newState, 'networking');
                
                oldNetworking?.off('stateChange', networkStateChangeHandler);
                newNetworking?.on('stateChange', networkStateChangeHandler);
                });

            return res("Connected to the Voice Channel");
        });
    };

    /**
     * 
     * @param channel voice channel to leave
     * @returns a promise that resolves when the bot leaves the voice channel
     */
    public leaveVoiceChannel = async (channel: VoiceChannel) => {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id);
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!");
                try {
                    oldConnection.destroy();
                    this.delay(250);
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
     * @param seekTime time to seek to in milliseconds
     * @returns a discord audio resource
     */
    public getResource = (queue: IQueue, songInfoId: string, seekTime: number) => {
        let Qargs = "";
        const effects = queue.effects;

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

        
        const encoderArgs = Qargs ? ["-af", Qargs] : ['-af', 'bass=g=2,dynaudnorm=f=200']

        let requestOpts : downloadOptions = {
            // filter: "audioonly",
            // highWaterMark: 1 << 62,
            // liveBuffer: 1 << 62,
            // dlChunkSize: 0,
            // begin: seekTime,
            // quality: "highestaudio",
        };


        if (this.config.YOUTUBE_LOGIN_COOKIE && this.config.YOUTUBE_LOGIN_COOKIE.length > 10) {
            requestOpts.requestOptions = {
                headers: {
                    cookie: this.config.YOUTUBE_LOGIN_COOKIE,
                },
            };
        }

        
        const stream = ytdl(this.getYTLink(songInfoId), requestOpts).once('error', (err) => console.error(err.message, '\n', err.stack))


        const newStream = FFmpeg(stream).audioChannels(2).audioBitrate(128).audioFrequency(48000).noVideo().addOptions(encoderArgs).on('error', (err) => console.error(err.message, '\n', err.stack))

        const passThrought = new PassThrough();
        newStream.seekInput(this.formatDuration(seekTime)).writeToStream(passThrought);
        
    
        const resource = createAudioResource(passThrought);


        const volume = queue && queue.volume && queue.volume <= 100 && queue.volume > 1 ? (queue.volume / 100) : 1;
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
    public playSong = async (channel: VoiceChannel, songInfo: Video) => {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guildId);
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!");
                try {
                    const curQueue = this.queues.get(channel.guildId);

                    if (!curQueue) return rej("No queue found");

                    const player = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Stop,
                        },
                    });
                    oldConnection.subscribe(player);

                    if (!songInfo.id) return rej("No song id found");

                    const resource = this.getResource(curQueue, songInfo.id, 0);
                    
                    player.play(resource)

                    player.on(AudioPlayerStatus.Playing, () => {
                        const queue = this.queues.get(channel.guildId)
                        if (queue && queue.filtersChanged) {
                            queue.filtersChanged = false
                        }
                        else {
                            this.sendQueueUpdate(channel.guildId)
                        }

                    });

                    player.on(AudioPlayerStatus.Idle, () => {
                        const queue = this.queues.get(channel.guildId);
                        if (!queue || !queue.tracks || queue.tracks.length == 0) return;
                        this.handleQueue(player, queue);
                    });
                    
                    player.on('error', error => {
                        console.log("Error, playing next song: ", error)
                        const queue = this.queues.get(channel.guildId);
                        if (!queue || !queue.tracks || queue.tracks.length == 0) return;
                        
                        this.handleQueue(player, queue);
                    });

                    return res(songInfo);
                }
                catch (e) {
                    console.error(e);
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
    public sendQueueUpdate = async (guildId: string) => {
        const queue = this.queues.get(guildId);
        if (!queue || !queue.tracks || queue.tracks.length == 0) return false;

        const channel = this.channels.cache.get(this.config.baseChannelId) || await this.channels.fetch(queue.textChannel).catch((err) => console.log(err));
        const textChannel = channel?.isTextBased() ? channel as TextChannel : null;
        if (!textChannel) return false;
        
        const song = queue.tracks[0];

        const songEmbed = new EmbedBuilder()
            .setColor(Colors.Fuchsia)
            .setTitle(`${song.title}`)
            .setURL(this.getYTLink(song.id ? song.id : ""))
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
    }

    /**
     * 
     * @param song song to create
     * @param requester requester of the song
     * @returns the song with the requester
     */
    public createSong = (song: Video, requester: User) => {
        return { ...song, requester } as IESong;
    };

    /**
     * 
     * @param length length of the queue
     * @returns the position in the queue
     */
    public queuePos = (length: number) => {
        const str: { [key: number]: string } = {
            1: "st",
            2: "nd",
            3: "rd",
        };
        return `${length}${str[length % 10] ? str[length % 10] : "th"}`;
    }

    /**
     * 
     * @param length length of the queue
     * @returns a queue
     */
    public createQueue = (song: Video, user: User, channelId: string, bitrate = 128) => {
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
            tracks: [this.createSong(song, user)],
            previous: undefined,
            creator: user,
            bitrate: bitrate,
        } as IQueue;
    }
    
    /**
     * 
     * @param ms time to delay
     * @returns a promise that resolves after the time
     */
    public delay = async (ms: number) => {
        return new Promise(r => setTimeout(() => r(2), ms));
    }

    /**
     * handle the queue
     * @param client client to use
     * @param player player to use
     * @param queue queue to use
     */
    public handleQueue = async (player: AudioPlayer, queue: IQueue) => {
        if (queue && !queue.filtersChanged ) {
            try {
                player.stop();
                if (queue && queue.tracks && queue.tracks.length > 1) {
                    queue.previous = queue.tracks[0];
                    if (queue.trackloop && !queue.skipped) {
                        if (queue.paused) queue.paused = false;
                        player.play(this.getResource(queue, queue.tracks[0].id, 0));
                    }
                    else if (queue.queueloop && !queue.skipped) {
                        const skipped = queue.tracks.shift();
                        if (!skipped) return;
                        queue.tracks.push(skipped);
                        if (queue.paused) queue.paused = false;
                        player.play(this.getResource(queue, queue.tracks[0].id, 0));
                    }
                    else {
                        if (queue.skipped) queue.skipped = false;
                        if (queue.paused) queue.paused = false;
                        queue.tracks.shift();
                        player.play(this.getResource(queue, queue.tracks[0].id, 0));
                    }
                }
                else if (queue && queue.tracks && queue.tracks.length <= 1) {
                    queue.previous = queue.tracks[0];
                    if (queue.trackloop || queue.queueloop && !queue.skipped) {
                        player.play(this.getResource(queue, queue.tracks[0].id, 0));
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

    private m2(t: number) {
        return t < 10 ? `0${t}` : `${t}` 
    }
    private m3(t: number) {
        return t < 100 ? `0${this.m2(t)}` : `${t}`
    }
}