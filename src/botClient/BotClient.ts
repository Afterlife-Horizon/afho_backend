import { AudioPlayer, AudioPlayerStatus, AudioResource, NoSubscriberBehavior, StreamType, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice"
import { Client, ClientOptions, Collection, Colors, EmbedBuilder, TextChannel, User, VoiceChannel } from "discord.js"
import { ICommand, IQueue, IESong, IFavorite } from "../types"
import fs from "node:fs"
import path from "node:path"

import interactionCreate from "./listeners/interactionCreate"
import messageCreate from "./listeners/messageCreate"
import voiceStateUpdate from "./listeners/voiceStateUpdate"
import DBClient from "../DB/DBClient"
import { Video } from "youtube-sr"
import ytdl from "ytdl-core-discord"

export default class BotClient extends Client {
    currentChannel: VoiceChannel | null;
    dbClient: DBClient
    config: {
        token: string;
        clientID: string;
        brasilChannelId: string;
        baseChannelId: string;
        openaiKey?: string;
        YOUTUBE_LOGIN_COOKIE?: string;
    };
    commands: Map<string, ICommand>;
    queues: Map<string, IQueue>;
    favs: Map<string, IFavorite[]>;
    ready: boolean;

    /**
     * 
     * @param ms time in milliseconds
     * @returns string of the given time in minutes:seconds format 
     */
    formatDuration!: (duration: number) => string

    /**
     * 
     * @param duration duration of the song
     * @param position current position of the song
     * @returns a string with the progress bar
     */
    createBar!: (player: number, position: number) => string

    /**
     * 
     * @returns string of the current time in hours:minutes:seconds.milliseconds format
     */
    getTime!: () => string

    /**
     * 
     * @param id youtube video id
     * @returns the youtube link of the given id
     */
    getYTLink!: (id: string) => string

    /**
     * 
     * @param channel voice channel to join
     * @returns a promise that resolves when the bot joins the voice channel
     */
    joinVoiceChannel!: (channel: any) => Promise<any>

    /**
     * 
     * @param channel voice channel to leave
     * @returns a promise that resolves when the bot leaves the voice channel
     */
    leaveVoiceChannel!: (channel: any) => Promise<any>

    /**
     * 
     * @param queue queue of the guild
     * @param songInfoId id of the song
     * @param seekTime time to seek to
     * @returns a discord audio resource
     */
    getResource!: (queue: IQueue, songInfoId: any, seekTime: number) => Promise<AudioResource<null>>

    /**
     * 
     * @param channel voice channel to play in
     * @param songInfo song to play
     * @returns a promise that resolves when the song is played
     */
    playSong!: (channel: any, songInfo: any) => Promise<string | unknown | any>

    /**
     * Sends an update to the queue
     * @param guildId id of the guild
     * @returns true
     */
    sendQueueUpdate!: (guildId: string) => Promise<boolean>

    /**
     * 
     * @param song song to create
     * @param requester requester of the song
     * @returns the song with the requester
     */
    createSong!: (song: Video, requester: User) => IESong

    /**
     * 
     * @param length length of the queue
     * @returns the position in the queue
     */
    queuePos!: (length: number) => string

    /**
     * 
     * @param length length of the queue
     * @returns a queue
     */
    createQueue!: (song: Video, user: User, channelId: string, bitrate: number) => IQueue


    constructor(options: ClientOptions) {
        super(options)
        this.config = {
            token: process.env.TOKEN || "",
            clientID: process.env.CLIENT_ID || "",
            brasilChannelId: process.env.BRASIL_CHANNEL_ID || "",
            baseChannelId: process.env.BASE_CHANNEL_ID || "",
            openaiKey: process.env.OPENAI_KEY,
            YOUTUBE_LOGIN_COOKIE: process.env.YOUTUBE_LOGIN_COOKIE
        }
        this.commands = new Collection();
        this.queues = new Collection();
        this.favs = new Collection();
        this.ready = false;
        this.initCommands();
        this.initUtils();
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

    private initUtils() {
        function m2(t: number) {
            return t < 10 ? `0${t}` : `${t}` 
        }
        function m3(t: number) {
            return t < 100 ? `0${m2(t)}` : `${t}`
        }

        this.formatDuration = (ms: number) => {
            let sec = Math.floor(ms / 1000 % 60);
            let min = Math.floor(ms / (1000 * 60) % 60);
            const hrs = Math.floor(ms / (1000 * 60 * 60) % 24);
            if (sec >= 60) sec = 0;
            if (min >= 60) min = 0;
            if (hrs > 1) return `${m2(hrs)}:${m2(min)}:${m2(sec)}`;
            return `${m2(min)}:${m2(sec)}`;
        };

        this.createBar = (duration: number, position: number) => {
            const full = "▰";
            const empty = "▱";
            const size = "▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱".length;
            const percent = duration == 0 ? 0 : Math.floor(position / duration * 100);
            const fullBars = Math.round(size * (percent / 100));
            const emptyBars = size - fullBars;
            return `**${full.repeat(fullBars)}${empty.repeat(emptyBars)}**`;
        };

        this.getTime = () => {
            const date = new Date;
            return `${m2(date.getHours())}:${m2(date.getMinutes())}:${m2(date.getSeconds())}.${m3(date.getMilliseconds())}`;
        };

        this.getYTLink = (id: string) => {
            return `https://www.youtube.com/watch?v=${id}`;
        };

        this.joinVoiceChannel = async (channel) => {
            return new Promise((res, rej) => {
                const oldConnection = getVoiceConnection(channel.guild.id);
                if (oldConnection) return rej("I'm already connected in: <#" + oldConnection.joinConfig.channelId + ">");
                const newConnection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
    
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
    
                return res("Connected to the Voice Channel");
            });
        };

        this.leaveVoiceChannel = async (channel) => {
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

        this.getResource = async (queue, songInfoId, seekTime = 0) => {
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
    
    
            const requestOpts = {
                requestOptions: {},
                fmt: "mp3",
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
                seek: Math.floor(seekTime / 1000),
                bitrate: queue.bitrate || 128,
                quality: "lowestaudio",
                encoderArgs: Qargs ? ["-af", Qargs] : ['-af', 'bass=g=2,dynaudnorm=f=200'],
            };
    
            if (this.config.YOUTUBE_LOGIN_COOKIE && this.config.YOUTUBE_LOGIN_COOKIE.length > 10) {
                requestOpts.requestOptions = {
                    headers: {
                        cookie: this.config.YOUTUBE_LOGIN_COOKIE,
                    },
                };
            }
    
            const resource = createAudioResource(await ytdl(this.getYTLink(songInfoId), requestOpts), {
                inputType: StreamType.Opus,
                inlineVolume: true,
            });
    
            const volume = queue && queue.volume && queue.volume <= 100 && queue.volume > 1 ? (queue.volume / 100) : 1;
            resource.volume?.setVolume(volume);
            resource.playbackDuration = seekTime;
            return resource;
        };

        this.playSong = async (channel, songInfo) => {
            return new Promise(async (res, rej) => {
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
    
                        const resource = this.getResource(curQueue, songInfo.id, songInfo.seekTime || 0);
                        
                        player.play(await resource)
    
                        player.on(AudioPlayerStatus.Paused, () => {
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
                            if (!queue || !queue.tracks || queue.tracks.length == 0) 
                                return this.sendQueueUpdate(channel.guildId);
                            this.handleQueue(player, queue);
                        });
                        
                        player.on('error', error => {
                            console.error(error);
                            const queue = this.queues.get(channel.guildId);
                            if (!queue || !queue.tracks || queue.tracks.length == 0) 
                                return this.sendQueueUpdate(channel.guildId);
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

        this.sendQueueUpdate = async (guildId) => {
            const queue = this.queues.get(guildId);
            if (!queue || !queue.tracks || queue.tracks.length == 0 || !queue.textChannel) return false;

            const channel = this.channels.cache.get(queue.textChannel) || await this.channels.fetch(queue.textChannel).catch((err) => console.log(err));
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

        this.createSong = (song: Video, requester: User) => {
            return { ...song, requester } as IESong;
        };

        this.queuePos = (length: number) => {
            const str: { [key: number]: string } = {
                1: "st",
                2: "nd",
                3: "rd",
            };
            return `${length}${str[length % 10] ? str[length % 10] : "th"}`;
        }

        this.createQueue = (song: Video, user: User, channelId: string, bitrate = 128) => {
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
    }

    private initListeners() {
        interactionCreate(this)
        messageCreate(this)
        voiceStateUpdate(this)
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
        if (queue && !queue.filtersChanged) {
            try {
                player.stop();
                if (queue && queue.tracks && queue.tracks.length > 1) {
                    queue.previous = queue.tracks[0];
                    if (queue.trackloop && !queue.skipped) {
                        if (queue.paused) queue.paused = false;
                        player.play(await this.getResource(queue, queue.tracks[0].id, 0));
                    }
                    else if (queue.queueloop && !queue.skipped) {
                        const skipped = queue.tracks.shift();
                        if (!skipped) return;
                        queue.tracks.push(skipped);
                        if (queue.paused) queue.paused = false;
                        player.play(await this.getResource(queue, queue.tracks[0].id, 0));
                    }
                    else {
                        if (queue.skipped) queue.skipped = false;
                        if (queue.paused) queue.paused = false;
                        queue.tracks.shift();
                        player.play(await this.getResource(queue, queue.tracks[0].id, 0));
                    }
                }
                else if (queue && queue.tracks && queue.tracks.length <= 1) {
                    queue.previous = queue.tracks[0];
                    if (queue.trackloop || queue.queueloop && !queue.skipped) {
                        player.play(await this.getResource(queue, queue.tracks[0].id, 0));
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
}