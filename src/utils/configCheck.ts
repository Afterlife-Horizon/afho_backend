import parseWebsiteURL from "#/functions/parseWebsiteURL"
import { Logger } from "#/logger/Logger"
import { IEnv } from "#/types"

export default function configCheck() {
    if (!process.env.LOG_LEVEL) Logger.warn("No log level found, using 'info' instead...")

    if (process.env.METHOD && process.env.METHOD !== "add" && process.env.METHOD !== "delete") {
        Logger.error("Invalid method provided, please use 'add' or 'delete'")
        throw new Error("Invalid method provided, please use 'add' or 'delete'")
    } else if (process.env.METHOD) {
        Logger.log("Running in " + process.env.METHOD + " mode")
        if (!process.env.CLIENT_ID) {
            Logger.error("No clientID found")
            throw new Error("No clientID found")
        }
        if (!process.env.TOKEN) {
            Logger.error("No token found")
            throw new Error("No token found")
        }
    }

    if (!process.env.DATABASE_URL) {
        Logger.error("No database URL found")
        throw new Error("No database URL found")
    }
    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
        Logger.error("No discord token or clientID found")
        throw new Error("No discord token or clientID found")
    }
    if (!process.env.BRASIL_CHANNEL_ID || !process.env.BASE_CHANNEL_ID) {
        Logger.error("No channel IDs found")
        throw new Error("No channel IDs found")
    }
    if (!process.env.SERVER_ID) {
        Logger.error("No server ID found")
        throw new Error("No server ID found")
    }
    if (!process.env.ADMIN_ROLE_ID) {
        Logger.error("No admin role ID found")
        throw new Error("No admin role ID found")
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        Logger.error("No Supabase credentials found")
        throw new Error("No Supabase credentials found")
    }
    if (!process.env.WEBSITE_URL) {
        Logger.error("No website URL found")
        throw new Error("No website URL found")
    }

    if (!process.env.CERT || !process.env.CERT_KEY) Logger.warn("No SSL certificate found, using HTTP instead...")
    if (process.env.CERT && process.env.CERT_KEY && !process.env.CA_CERT) Logger.warn("No CA certificate found for certificates")
    if (!process.env.OPENAI_KEY || !process.env.CHAT_GPT_CHANNEL_ID) Logger.warn("No OpenAI key found, not using OpenAI API")
    if (!process.env.REACTION_ROLE_CHANNEL_ID) Logger.warn("No roles channel ID found, not using reaction roles")
    if (!process.env.YOUTUBE_LOGIN_COOKIE) Logger.warn("No YouTube cookie found, not using cookie for YouTube API")
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) Logger.warn("No Spotify credentials found")
    if (process.env.NODE_ENV === "development") Logger.warn("Running in development mode, no webserver will be started")
    if (!process.env.FF14_NEWS_CHANNEL_ID) Logger.warn("No FF14 news channel ID found, not using FF14 news feed")
    if (!process.env.VOICEFUNNY) Logger.warn("No voice funny found, not using voice funny")
    if (!process.env.BIRTHDAY_CHANNEL_ID) Logger.warn("No birthday channel id set, using base bot channel")

    const environement: IEnv = {
        token: process.env.TOKEN,
        clientID: process.env.CLIENT_ID,
        brasilChannelID: process.env.BRASIL_CHANNEL_ID,
        baseChannelID: process.env.BASE_CHANNEL_ID,
        serverID: process.env.SERVER_ID,
        adminRoleID: process.env.ADMIN_ROLE_ID,
        websiteURL: parseWebsiteURL(process.env.WEBSITE_URL),
        supabaseURL: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_KEY,
        cert: process.env.CERT,
        certKey: process.env.CERT_KEY,
        caCert: process.env.CA_CERT,
        openAIKey: process.env.OPENAI_KEY,
        youtubeCookie: process.env.YOUTUBE_LOGIN_COOKIE,
        gptChatChannelID: process.env.CHAT_GPT_CHANNEL_ID,
        ff14NewsChannelID: process.env.FF14_NEWS_CHANNEL_ID,
        reactionRoleChannel: process.env.REACTION_ROLE_CHANNEL_ID,
        spotifyClientID: process.env.SPOTIFY_CLIENT_ID,
        spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        funnySound: process.env.VOICEFUNNY === "0" ? false : true,
        birthdayChannelId: process.env.BIRTHDAY_CHANNEL_ID ? process.env.BIRTHDAY_CHANNEL_ID : process.env.BASE_CHANNEL_ID
    }
    return environement
}
