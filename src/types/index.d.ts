import type BotClient from "#/botClient/BotClient"
import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { Videos } from "prisma/prisma-client"

export interface IEnv {
    token: string
    clientID: string
    brasilChannelID: string
    baseChannelID: string
    serverID: string
    adminRoleID: string
    supabaseURL: string
    supabaseKey: string
    websiteURL: string
    spotifyClientID?: string
    spotifyClientSecret?: string
    cert?: string
    certKey?: string
    caCert?: string
    openAIKey?: string
    youtubeCookie?: string
    gptChatChannelID?: string
    ff14NewsChannelID?: string
    reactionRoleChannel?: string
    funnySound?: boolean
    birthdayChannelId: string
}

export interface IClientConfig extends IEnv {
    reactionRoles?: IReactionRole[]
}

export interface IReactionRole {
    description: string
    emojiName: string
    roleID: string
}

export interface ICommand {
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    execute: (interaction: CommandInteraction) => Promise<any>
}

export type CommandFunction = (client: BotClient) => ICommand

export interface Bresil {
    id: string
    bresil_received: number
    bresil_sent: number
}

export interface APIBresil extends Bresil {
    username: string
}

export interface Level {
    id: string
    xp: number
    lvl: number
}

export type Xp = {
    user: GuildMember
    xp: number
    lvl: number
}
export type Time = { user: GuildMember; time_spent: number }

export interface APILevel extends Level {
    username: string
}

export interface IFunctionResponse {
    message?: string
    error?: string
    status: number
}

export type Fav = {
    user: GuildMember
    fav: Videos
}

export type Favorite = {
    userId: string
} & Videos
