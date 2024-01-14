import getLevelFromXp from "#/functions/getLevelFromXp"
import { Logger } from "#/logger/Logger"
import { Xp, Time, Fav } from "#/types"
import { Achievement, AchievementType } from "#/types/achievements"
import { Collection, Guild, GuildMember, User } from "discord.js"
import BotClient from "./BotClient"
import { Videos } from "@prisma/client"
import ytdl from "ytdl-core"
import YouTube from "youtube-sr"

export default class CacheHandler {
    private botClient: BotClient

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

    constructor(botClient: BotClient) {
        this.botClient = botClient

        this.favs = new Collection()
        this.achievements = new Collection()
        this.connectedMembers = new Collection()
        this.xps = new Collection()
        this.timeValues = new Collection()
        this.sounds = new Collection()
    }

    public async init() {
        const sounds = await this.botClient.prisma.sounds.findMany()
        sounds.forEach(sound => {
            this.sounds.set(sound.word, sound.path)
        })
    }

    /**
     * Update the cache of the bot
     */
    public async updateCache() {
        const guild = await this.fetchGuildinfo()
        if (!guild) return

        this.updateXp(guild)
        this.updateTimes(guild)
        this.updateFavs(guild)
        this.updateAcheivements(guild)
        this.updateDBUsers(guild)
        this.updateDBVideos()
    }

    private async fetchGuildinfo() {
        const guild = await this.botClient.guilds.fetch(this.botClient.config.serverID)
        if (!guild) return null
        guild.members.fetch()
        guild.channels.fetch()
        guild.roles.fetch()
        guild.emojis.fetch()
        return guild
    }

    private async updateXp(guild: Guild) {
        const xpRows = await this.botClient.prisma.levels.findMany()
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
    }

    private async updateTimes(guild: Guild) {
        const timeRows = await this.botClient.prisma.time_connected.findMany()
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
    }

    /**
     * Updates the achievements cache
     */
    private async updateAcheivements(guild: Guild) {
        const achievementRows = await this.botClient.prisma.achievement_get.findMany()
        const achievements = await this.botClient.prisma.achievements.findMany()
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
     * Update the Favorites cache
     */
    private async updateFavs(guild: Guild) {
        const favRows = await this.botClient.prisma.favorites.findMany()
        const videos = await this.botClient.prisma.videos.findMany()
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
     * Update all users in the database
     */
    public async updateDBUsers(guild: Guild) {
        const users = guild.members.cache.filter(member => !member.user.bot)
        users.forEach(async member => {
            await this.updateDBUser(member)
        })
    }

    /**
     * Update a user in the database
     * @param member GuildMember to update in the database
     */
    public async updateDBUser(member: GuildMember) {
        await this.botClient.prisma.users
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
     * Update all videos in the database
     */
    public async updateDBVideos() {
        const videos = await this.botClient.prisma.videos.findMany()
        videos.forEach(async video => {
            if (video.type === "playlist") await this.updateDBPlaylist(video)
            else await this.updateDBVideo(video)
        })
    }

    /**
     * Update a video in the database
     * @param video Video to update in the database
     */
    public async updateDBVideo(video: Videos) {
        const videoInfo = await YouTube.getVideo(video.url)
        await this.botClient.prisma.videos
            .update({
                where: { id: video.id },
                data: {
                    name: videoInfo.title,
                    thumbnail: videoInfo.thumbnail?.url
                }
            })
            .catch(err => {
                Logger.error(err)
            })
    }

    /**
     * Update a playlist in the database
     * @param video Video to update in the database
     */
    public async updateDBPlaylist(video: Videos) {
        const playlist = await YouTube.getPlaylist(video.url)
        await this.botClient.prisma.videos
            .update({
                where: { id: video.id },
                data: {
                    name: playlist.title,
                    thumbnail: playlist.thumbnail?.url
                }
            })
            .catch(err => {
                Logger.error(err)
            })
    }
}
