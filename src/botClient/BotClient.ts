import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { Client, ClientOptions, Collection, Colors, EmbedBuilder } from "discord.js"
import fs from "node:fs"
import path from "node:path"

import { Logger } from "#/logger/Logger"
import { PrismaClient } from "@prisma/client"
import interactionCreate from "./listeners/interactionCreate"
import messageCreate from "./listeners/messageCreate"
import voiceStateUpdate from "./listeners/voiceStateUpdate"

import { isTextChannel } from "#/functions/discordUtils"
import getFinalFantasyFeed, { FeedType } from "#/functions/getFinalFantasyFeed"
import type { IClientConfig, ICommand, IEnv } from "#/types"
import CacheHandler from "./CacheHandler"
import { MusicHamdler as MusicHandler } from "./MusicHandler"
import VoiceHandler from "./VoiceHandler"

export default class BotClient extends Client {
    public musicHandler: MusicHandler
    public cacheHandler: CacheHandler
    public voiceHandler: VoiceHandler

    /**
     * The config passed to the constructor
     */
    public config: IClientConfig

    /**
     * prisma client
     */
    public prisma: PrismaClient

    /**
     * Supabase client
     */
    public supabaseClient: SupabaseClient<any, "public", any>

    /**
     * The discord commands
     */
    public commands: Collection<string, ICommand>

    /**
     * Whether the bot is ready or not
     */
    public ready: boolean

    public constructor(options: ClientOptions, environment: IEnv) {
        super(options)
        this.ready = false
        this.config = environment

        this.prisma = new PrismaClient()
        this.commands = new Collection()
        this.supabaseClient = createClient(this.config.supabaseURL, this.config.supabaseKey)

        this.musicHandler = new MusicHandler(this)
        this.cacheHandler = new CacheHandler(this)
        this.voiceHandler = new VoiceHandler(this)

        this.init()
    }

    private async init() {
        this.initCommands()
        this.initListeners()
        this.initReactionRoles(this.config)
        // this.getSpotifyToken()
    }

    /**
     * Initializes the role reaction
     * @param environment The environment variables
     **/
    private async initReactionRoles(environment: IClientConfig) {
        if (environment.reactionRoleChannel) {
            try {
                const res = await this.prisma.role_assignment.findMany({
                    select: {
                        description: true,
                        emojiName: true,
                        roleID: true
                    }
                })
                this.config.reactionRoles = res
            } catch (error) {
                Logger.error(error)
            }
        }
    }

    /**
     * Initialize Variables
     */
    public async initVars() {
        Logger.log("Initializing variables...")
        this.cacheHandler.init()
        this.voiceHandler.init()
        Logger.log("Variables initialized")
    }

    /**
     * fetch the access token for spotify
     * @returns The spotify token
     */
    public async getSpotifyToken() {
        if (!this.config.spotifyClientID || !this.config.spotifyClientSecret) return
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: this.config.spotifyClientID,
                client_secret: this.config.spotifyClientSecret
            })
        })

        if (!res.ok) return Logger.error(`Error while getting the spotify token:\n${JSON.stringify(res)}`)

        const data = await res.json()
        return data.access_token
    }

    /**
     * Init the commands of the bot
     */
    private initCommands() {
        const commandsPath = path.join(__dirname, "commands")
        fs.readdirSync(commandsPath).forEach(dir => {
            const directorypath = path.join(commandsPath, dir)
            fs.readdirSync(directorypath)
                .filter(file => file.endsWith(".js") || file.endsWith(".ts"))
                .forEach(file => {
                    const filePath = path.join(directorypath, file)
                    const { default: commandFunction } = require(filePath)
                    const command = commandFunction(this)
                    this.commands.set(command.data.name, command)
                })
        })
    }

    /**
     * Init the listeners of the bot
     */
    private initListeners() {
        interactionCreate(this)
        messageCreate(this)
        voiceStateUpdate(this)
    }

    public async checkBirthdays() {
        const birthdays = await this.prisma.birthDate.findMany()
        const now = new Date()

        const guild = this.guilds.cache.get(this.config.serverID)
        if (!guild) return Logger.error("Guild not found!")

        const textChannel = await guild.channels.fetch(this.config.birthdayChannelId)
        if (!textChannel) return Logger.error("Birthday Channel not found!")
        if (!isTextChannel(textChannel)) return Logger.error("Birthday Channel is not a text channel!")

        for (const birthday of birthdays) {
            if (!birthday.annouceBirthday || now.getDate() != birthday.birthdate.getDate() || now.getMonth() != birthday.birthdate.getMonth())
                continue
            if (!!birthday.lastWished && birthday.lastWished.getFullYear() === now.getFullYear()) continue

            const user = this.users.cache.get(birthday.user_id)
            if (!user) continue

            const age = now.getFullYear() - birthday.birthdate.getFullYear()

            const embed = new EmbedBuilder()
                .setAuthor({ name: "🎂 Birthday Annoucement 🎂" })
                .setColor(Colors.DarkPurple)
                .setDescription(`Please wish ${user} a Happy Birthday!${birthday.displayAge ? `\n▶ ${user} is now ${age} years old!` : ``} `)
                .setTimestamp(now)
                .setFooter({ text: "🎁Happy Birthday" })

            await textChannel.send({ embeds: [embed] }).catch(Logger.error)

            await this.prisma.birthDate.update({
                where: {
                    user_id: birthday.user_id
                },
                data: {
                    lastWished: now
                }
            })
        }
    }

    /**
     * check for new game feeds and send them to their channels
     */
    public async fetchGameFeeds() {
        if (!this.config.ff14NewsChannelID) return
        const textChannel = await this.channels.fetch(this.config.ff14NewsChannelID)
        if (!textChannel) return Logger.error("The ff14 news channel is not found")
        if (!isTextChannel(textChannel)) return Logger.error("The ff14 news channel is not a text channel")

        const [newsFeed, topicsFeed] = await Promise.all([
            getFinalFantasyFeed("https://fr.finalfantasyxiv.com/lodestone/news/news.xml", FeedType.NEWS),
            getFinalFantasyFeed("https://fr.finalfantasyxiv.com/lodestone/news/topics.xml", FeedType.TOPIC)
        ]).then(value => value)

        if (newsFeed instanceof Error) return Logger.error(newsFeed)
        if (topicsFeed instanceof Error) return Logger.error(topicsFeed)

        const embed1 = new EmbedBuilder()
            .setTitle(newsFeed.title)
            .setThumbnail(newsFeed.image)
            .setDescription(newsFeed.message)
            .setAuthor({ name: newsFeed.author })
            .setColor(Colors.Blue)
            .setTimestamp(newsFeed.date)
            .setURL(newsFeed.link)

        const embed2 = new EmbedBuilder()
            .setTitle(topicsFeed.title)
            .setThumbnail(topicsFeed.image)
            .setDescription(topicsFeed.message)
            .setAuthor({ name: topicsFeed.author })
            .setColor(Colors.Gold)
            .setTimestamp(topicsFeed.date)
            .setURL(topicsFeed.link)

        const isSameTime = newsFeed.date.getTime() === topicsFeed.date.getTime()
        const lastest = newsFeed.date < topicsFeed.date ? topicsFeed : newsFeed

        const lastMessage = (await textChannel.messages.fetch()).filter(m => m.author.id === this.user?.id).first()
        if (!lastMessage) {
            await textChannel
                .send({
                    embeds: isSameTime ? [embed1, embed2] : [lastest.id === newsFeed.id ? embed1 : embed2]
                })
                .catch(Logger.error)
            return
        }

        const messageTimeStamp = lastMessage.createdAt.getTime()
        const dateTimeStamp = lastest.id === newsFeed.id ? newsFeed.date.getTime() : topicsFeed.date.getTime()

        if (dateTimeStamp > messageTimeStamp)
            await textChannel
                .send({
                    embeds: isSameTime ? [embed1, embed2] : [lastest.id === newsFeed.id ? embed1 : embed2]
                })
                .catch(Logger.error)
    }

    /**
     * Stops the bot gracefully
     */
    public async stop() {
        await this.voiceHandler.stop()
        await this.destroy()
    }
}
