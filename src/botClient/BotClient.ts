import {
    CreateVoiceConnectionOptions,
    JoinVoiceChannelOptions,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection,
    joinVoiceChannel
} from "@discordjs/voice"
import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { Client, ClientOptions, Collection, Colors, EmbedBuilder, GuildMember, User, VoiceChannel, VoiceState } from "discord.js"
import fs from "node:fs"
import path from "node:path"

import { PrismaClient, Videos } from "@prisma/client"
import { Logger } from "#/logger/Logger"
import interactionCreate from "./listeners/interactionCreate"
import messageCreate from "./listeners/messageCreate"
import voiceStateUpdate from "./listeners/voiceStateUpdate"

import { isTextChannel } from "#/functions/discordUtils"
import getFinalFantasyFeed, { FeedType } from "#/functions/getFinalFantasyFeed"
import getLevelFromXp from "#/functions/getLevelFromXp"
import { handleAchievements } from "#/functions/handleAchievements"
import type { Fav, IClientConfig, ICommand, IEnv, Time, Xp } from "#/types"
import { Achievement, AchievementType } from "#/types/achievements"
import { MusicHamdler as MusicHandler } from "./MusicHandler"

export default class BotClient extends Client {
    public musicHandler: MusicHandler

    /**
     * The current channel where the bot is connected
     */
    public currentChannel: VoiceChannel | null

    /**
     * prisma client
     */
    public prisma: PrismaClient

    /**
     * The config passed to the constructor
     */
    public config: IClientConfig

    /**
     * The discord commands
     */
    public commands: Collection<string, ICommand>

    /**
     * User favorites cache
     */
    public favs: Collection<string, Videos[]>

    /**
     * User achievements cache
     */
    public achievements: Collection<string, Achievement[]>

    /**
     * User connected members cache
     */
    public connectedMembers: Collection<string, User>

    /**
     * Whether the bot is ready or not
     */
    public ready: boolean

    /**
     * Supabase client
     */
    public supabaseClient: SupabaseClient<any, "public", any>

    /**
     * Time buffer for connected users
     * Equivalent to the time spent in the voice channel after the last push to database
     * Used to increment the time passed in the voice channel
     */
    public times: Collection<string, Date>

    /**
     * User Time cache
     */
    public timeValues: Collection<string, Time>

    /**
     * User xp cache
     */
    public xps: Collection<string, Xp>

    /**
     * sound path cache
     */
    public sounds: Collection<string, string>

    public constructor(options: ClientOptions, environment: IEnv) {
        super(options)
        this.ready = false
        this.currentChannel = null
        this.config = environment

        this.prisma = new PrismaClient()
        this.commands = new Collection()
        this.favs = new Collection()
        this.achievements = new Collection()
        this.connectedMembers = new Collection()
        this.xps = new Collection()
        this.timeValues = new Collection()
        this.times = new Collection()
        this.sounds = new Collection()
        this.supabaseClient = createClient(this.config.supabaseURL, this.config.supabaseKey)

        this.musicHandler = new MusicHandler(this)

        this.initCommands()
        this.initListeners()
        this.initReactionRoles(environment)
        // this.getSpotifyToken()
    }

    /**
     * Initializes the role reaction
     * @param environment The environment variables
     **/
    private async initReactionRoles(environment) {
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
     * Stops the bot gracefully
     */
    public async stop() {
        const connection = getVoiceConnection(this.config.serverID)
        if (connection) connection.disconnect()

        for (const [id] of this.times) await this.pushTime(id)

        this.destroy()
    }

    /**
     * Pushes the time spent in the voice channel to the database and resets the time buffer
     */
    public async pushTime(id: string) {
        const time = this.times.get(id)
        if (!time) return

        const timeSpent = new Date().getTime() - time.getTime()
        const timeSpentSeconds = Math.round(timeSpent / 1000)

        const member = await this.guilds.fetch(this.config.serverID).then(guild => guild.members.fetch(id))
        if (!member) return

        await this.updateDBUser(member)

        const res = await this.prisma.time_connected
            .upsert({
                where: {
                    user_id: id
                },
                update: {
                    time_spent: {
                        increment: timeSpentSeconds
                    }
                },
                create: {
                    user_id: id,
                    time_spent: timeSpentSeconds
                },
                select: {
                    time_spent: true
                }
            })
            .then(res => res.time_spent)
            .catch(Logger.error)

        handleAchievements(this, AchievementType.TIME, id, res)
    }

    async updateTimes() {
        for (const [id] of this.times) {
            await this.pushTime(id)
            this.times.set(id, new Date())
        }
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
    public async updateGameFeeds() {
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
     * Initialize Variables
     */
    public async initVars() {
        const guild = await this.guilds.fetch(this.config.serverID)
        const connectedMembers = await guild.members.fetch().then(m => m.filter(m => m.voice.channel && !m.user.bot).map(m => m.user))
        connectedMembers.forEach(user => {
            this.connectedMembers.set(user.id, user)
            if (!user.bot) this.times.set(user.id, new Date())
        })

        const sounds = await this.prisma.sounds.findMany()
        sounds.forEach(sound => {
            this.sounds.set(sound.word, sound.path)
        })
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
                .filter(file => file.endsWith(".js"))
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

    /**
     * Update the cache of the bot
     */
    public async updateCache() {
        const guild = await this.guilds.fetch(this.config.serverID)
        if (!guild) return
        guild.members.fetch()
        guild.channels.fetch()
        guild.roles.fetch()
        guild.emojis.fetch()

        const xpRows = await this.prisma.levels.findMany()
        const xps = xpRows
            .map(row => {
                const level = getLevelFromXp(row.xp)
                const member = guild.members.cache.find(mem => mem.user.id === row.user_id)
                if (!member) return null
                return {
                    user: member,
                    xp: row.xp,
                    lvl: level
                }
            })
            .filter(xp => xp !== null) as Xp[]
        this.xps = new Collection(xps.map(xp => [xp.user.id, xp]))

        const timeRows = await this.prisma.time_connected.findMany()

        const times = timeRows
            .map(row => {
                const member = guild.members.cache.find(mem => mem.user.id === row.user_id)
                if (!member) return null
                return {
                    user: member,
                    time_spent: row.time_spent
                }
            })
            .filter(time => time !== null) as Time[]
        this.timeValues = new Collection(times.map(time => [time.user.id, time]))

        this.updateFavs()
        this.updateAcheivements()
    }

    /**
     * Update the Favorites cache
     */
    private async updateFavs() {
        const guild = await this.guilds.fetch(this.config.serverID)
        if (!guild) return
        const favRows = await this.prisma.favorites.findMany()
        const videos = await this.prisma.videos.findMany()
        const favs = favRows
            .map(row => {
                const member = guild.members.cache.find(mem => mem.user.id === row.user_id)
                if (!member) return null
                return {
                    user: member,
                    fav: videos.find(video => video.id === row.video_id)
                }
            })
            .filter(fav => fav !== null) as Fav[]
        this.favs = new Collection()
        favs.forEach(fav => {
            const currentFav = this.favs.get(fav.user.id) || []
            fav.fav.type = fav.fav.type === "video" ? "video" : "playlist"
            currentFav.push({ ...fav.fav, type: fav.fav.type })
            this.favs.set(fav.user.id, currentFav)
        })
    }

    /**
     * Updates the achievements cache
     */
    private async updateAcheivements() {
        const guild = await this.guilds.fetch(this.config.serverID)
        if (!guild) return
        const achievementRows = await this.prisma.achievement_get.findMany()
        const achievements = await this.prisma.achievements.findMany()
        const newAchievements: Achievement[] = achievementRows
            .map(row => {
                const member = guild.members.cache.find(mem => mem.user.id === row.user_id)
                if (!member) return null
                const achievement = achievements.find(ach => ach.name === row.achievement_name)
                if (!achievement) return null

                let achievementType: AchievementType | undefined
                switch (achievement.type) {
                    case AchievementType.MESSAGE:
                        achievementType = AchievementType.MESSAGE
                        break
                    case AchievementType.TIME:
                        achievementType = AchievementType.TIME
                        break
                    case AchievementType.BrasilRecieved:
                        achievementType = AchievementType.BrasilRecieved
                        break
                    case AchievementType.BrasilSent:
                        achievementType = AchievementType.BrasilSent
                        break
                    default:
                        achievementType = undefined
                }
                if (!achievementType) return null

                return {
                    user: member,
                    currentTitle: achievement.name,
                    type: achievementType
                }
            })
            .filter(achievement => achievement !== null) as Achievement[]
        this.achievements = new Collection()
        newAchievements.forEach(achievement => {
            const currentAchievement = this.achievements.get(achievement.user.id) || []
            currentAchievement.push(achievement)
            this.achievements.set(achievement.user.id, currentAchievement)
        })
    }

    /**
     *
     * @param duration duration of the song
     * @param position current position of the song
     * @returns a string with the progress bar
     */
    public createBar(duration: number, position: number) {
        const full = "▰"
        const empty = "▱"
        const size = "▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱".length
        const percent = duration == 0 ? 0 : Math.floor((position / duration) * 100)
        const fullBars = Math.round(size * (percent / 100))
        const emptyBars = size - fullBars
        return `**${full.repeat(fullBars)}${empty.repeat(emptyBars)}**`
    }

    /**
     * Update all users in the database
     */
    public async updateDBUsers() {
        const users = await this.guilds.fetch(this.config.serverID).then(guild => guild.members.fetch())
        users.forEach(async member => {
            await this.updateDBUser(member)
        })
    }

    /**
     * Update a user in the database
     * @param member GuildMember to update in the database
     */
    public async updateDBUser(member: GuildMember) {
        await this.prisma.users
            .upsert({
                where: { id: member.user.id },
                update: {
                    username: member.user.username,
                    nickname: member.nickname || null,
                    avatar: member.user.avatarURL() || null,
                    roles: member.roles.cache.map(role => role.id).join(",")
                },
                create: {
                    id: member.user.id,
                    username: member.user.username,
                    nickname: member.nickname || null,
                    avatar: member.user.avatarURL() || null,
                    roles: member.roles.cache.map(role => role.id).join(",")
                }
            })
            .catch(err => {
                Logger.error(err)
            })
    }

    /**
     *
     * @param channel voice channel to join
     * @returns a promise that resolves when the bot joins the voice channel
     */
    public async joinVoiceChannel(channel: VoiceChannel): Promise<string> {
        const networkStateChangeHandler = (_: VoiceState, newNetworkState: VoiceState) => {
            const newUdp = Reflect.get(newNetworkState, "udp")
            clearInterval(newUdp?.keepAliveInterval)
        }
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id)
            if (oldConnection) return rej("I'm already connected in: <#" + oldConnection.joinConfig.channelId + ">")

            const options = {
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            } as CreateVoiceConnectionOptions & JoinVoiceChannelOptions

            const newConnection = joinVoiceChannel(options)

            newConnection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(newConnection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(newConnection, VoiceConnectionStatus.Connecting, 5_000)
                    ])
                } catch (error) {
                    newConnection.destroy()
                }
            })

            newConnection.on(VoiceConnectionStatus.Destroyed, () => {
                this.musicHandler.queues.delete(channel.guild.id)
            })

            newConnection.on("stateChange", (oldState, newState) => {
                const oldNetworking = Reflect.get(oldState, "networking")
                const newNetworking = Reflect.get(newState, "networking")

                oldNetworking?.off("stateChange", networkStateChangeHandler)
                newNetworking?.on("stateChange", networkStateChangeHandler)
            })

            this.currentChannel = channel
            return res("Connected to the Voice Channel")
        })
    }

    /**
     *
     * @param channel voice channel to leave
     * @returns a promise that resolves when the bot leaves the voice channel
     */
    public async leaveVoiceChannel(channel: VoiceChannel) {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guild.id)
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!")
                try {
                    oldConnection.destroy()
                    this.currentChannel = null
                    return res(true)
                } catch (e) {
                    this.currentChannel = null
                    return rej(e)
                }
            } else {
                this.currentChannel = null
                return rej("I'm not connected somwhere.")
            }
        })
    }
}
