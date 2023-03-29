import { Client, CommandInteraction, SlashCommandBuilder, User } from "discord.js";
import { Thumbnail, Video } from "youtube-sr";
import BotClient from "../botClient/BotClient";
import { AudioResource } from "@discordjs/voice";

export interface IESong extends Video {
    requester: User;
}

export interface Track {
    seekTime: number;
    id: string;
    title: string;
    durationFormatted: string;
    requester: User;
    thumbnail: Thumbnail;
}

export interface IQueue {
    textChannel: string;
    paused: boolean;
    skipped: boolean;
    effects: IFilters;
    trackloop: boolean;
    queueloop: boolean;
    filtersChanged: boolean;
    volume: number;
    tracks: IESong[];
    previous: IESong | undefined;
    creator: User;
    bitrate: number;
    autoplay: boolean;
}

export interface IFilters {
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

export interface IFavorite {
    name: any; 
    url: any; 
    thumbnail: any; 
}

export interface ICommand {
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    execute: (interaction: CommandInteraction) => Promise<any>;
}

export type CommandFunction = (client: BotClient) => ICommand

export interface Bresil {
    id: string;
    bresil_received: number;
    bresil_sent: number;
}

export interface APIBresil extends Bresil {
    username: string;
}

export interface Level {
    id: string;
    xp: number;
    lvl: number;
}

export interface APILevel extends Level {
    username: string;
}

export interface IFunctionResponse {
    message?: string;
    error?: string;
    status: number
}