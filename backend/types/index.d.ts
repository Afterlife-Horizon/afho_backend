import { Client, CommandInteraction, User } from "discord.js";


export interface IClient extends Client {
    config?: {
        token: string;
        clientID: string;
        brasilChannelId: string;
        baseChannelId: string;
        openaiKey?: string;
        YOUTUBE_LOGIN_COOKIE?: string;
    }
    commands?: Map<string, ICommand>;
    queues?: Map<string, IQueue>;
    favs?: Map<string, any>;
    ready?: boolean;
    formatDuration?: (duration: number) => string;
    createBar?: (player: number, position: number) => string;
    getTime?: () => string;
    getYTLink?: (id: number) => string;
    joinVoiceChannel?: (channel: any) => Promise<any>;
    leaveVoiceChannel?: (channel: any) => Promise<any>;
    getResource?: (queue: IQueue, songInfoId: any, seekTime: number) => AudioResource<null>;
    playSong?: (channel: any, songInfo: any) => Promise<string | unknown | any>;
    sendQueueUpdate?: (guildId: string) => Promise<boolean>;
    createSong?: (song: ISong, requester: User) => IESong;
    queuePos?: (queue: IQueue, songInfoId: any) => string;
    createQueue?: (song: ISong, user: User, channelId: string, bitrate: number) => IQueue;
}

export interface ISong {
    name: string;
    artist: string;
    requester: string;
    filters: {
        bassboost: number;
        subboost: boolean;
        mcompand: boolean;
        haas: boolean;
        gate: boolean;
        karaoke: boolean;
        flanger: boolean;
        pulsator: boolean;
        surrounding: boolean,
        "3d": boolean,
        vaporwave: boolean,
        nightcore: boolean,
        phaser: boolean,
        normalizer: boolean,
        speed: number,
        tremolo: boolean,
        vibrato: boolean,
        reverse: boolean,
        treble: boolean;
    };
    url: string;
    formatedprog: string;
    duration: string;
    cover_src: string;
}

export interface IESong extends ISong {
    requester: User;
}

export interface IQueue {
    textChannel: string;
    paused: boolean;
    skipped: boolean;
    effects: IEffects;
    trackloop: boolean;
    queueloop: boolean;
    filtersChanged: boolean;
    volume: number;
    tracks: IESong[];
    previous: IESong | undefined;
    creator: User;
    bitrate: number;
}

export interface IEffects {
    bassboost: number;
    subboost: boolean;
    mcompand: boolean;
    haas: boolean;
    gate: boolean;
    karaoke: boolean;
    flanger: boolean;
    pulsator: boolean;
    surrounding: boolean,
    "3d": boolean,
    vaporwave: boolean,
    nightcore: boolean,
    phaser: boolean,
    normalizer: boolean,
    speed: number,
    tremolo: boolean,
    vibrato: boolean,
    reverse: boolean,
    treble: boolean;
}

export interface ICommand {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<any>;
}