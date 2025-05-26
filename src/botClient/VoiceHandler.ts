import { VoiceChannel, Collection, VoiceState } from "discord.js"
import BotClient from "./BotClient"
import { handleAchievements } from "#/functions/handleAchievements"
import { Logger } from "#/logger/Logger"
import { AchievementType } from "#/types/achievements"
import {
    CreateVoiceConnectionOptions,
    JoinVoiceChannelOptions,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection,
    joinVoiceChannel
} from "@discordjs/voice"
import { channel } from "diagnostics_channel"

export default class VoiceHandler {
    private botClient: BotClient

    /**
     * The current channel where the bot is connected
     */
    public currentChannel: VoiceChannel | null

    /**
     * Time buffer for connected users
     * Equivalent to the time spent in the voice channel after the last push to database
     * Used to increment the time passed in the voice channel
     */
    public times: Collection<string, Date>

    constructor(botClient: BotClient) {
        this.botClient = botClient

        this.currentChannel = null
        this.times = new Collection()
    }

    public async init() {
        const guild = this.botClient.guilds.cache.get(this.botClient.config.serverID)
        if (!guild) return
        const connectedMembers = await guild.members.fetch().then(m => m.filter(m => m.voice.channel && !m.user.bot).map(m => m.user))
        connectedMembers.forEach(user => {
            this.botClient.cacheHandler.connectedMembers.set(user.id, user)
            if (!user.bot) this.times.set(user.id, new Date())
        })
    }

    /**
     * Pushes the time spent in the voice channel to the database and resets the time buffer
     */
    public async pushTime(id: string) {
        const time = this.times.get(id)
        if (!time) return

        const timeSpent = new Date().getTime() - time.getTime()
        const timeSpentSeconds = Math.round(timeSpent / 1000)

        const member = await this.botClient.guilds.fetch(this.botClient.config.serverID).then(guild => guild.members.fetch(id))
        if (!member) return

        await this.botClient.cacheHandler.updateDBUser(member)

        const res = await this.botClient.prisma.time_connected
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

        handleAchievements(this.botClient, AchievementType.TIME, id, res)
    }

    async updateTimes() {
        for (const [id] of this.times) {
            await this.pushTime(id)
            this.times.set(id, new Date())
        }
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
                this.botClient.musicHandler.queues.delete(channel.guild.id)
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

    public async stop() {
        const connection = getVoiceConnection(this.botClient.config.serverID)
        if (connection) connection.disconnect()
        for (const [id] of this.times) await this.pushTime(id)
    }
}
