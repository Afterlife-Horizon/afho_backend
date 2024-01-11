import { createAudioResource, getVoiceConnection, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus, AudioPlayer } from "@discordjs/voice"
import { ActivityType, VoiceChannel, TextChannel, EmbedBuilder, Colors, User, Collection } from "discord.js"
import { Logger } from "#/logger/Logger"
import { PassThrough } from "stream"
import { IQueue, IESong } from "#/types/music"
import { Video } from "youtube-sr"
import ytdl, { downloadOptions } from "ytdl-core"
import FFmpeg, { FfmpegCommand } from "fluent-ffmpeg"
import { getYTLink } from "#/functions/getYTLink"
import BotClient from "./BotClient"
import { formatDuration } from "#/functions/time"

export class MusicHamdler {
    /**
     * The music queues
     */
    public queues: Collection<string, IQueue>

    /**
     * output stream for ffmpeg
     */
    public passThrought?: PassThrough

    /**
     * FFmpeg command to stream audio with filters
     */
    public stream?: FfmpegCommand

    private discordBot: BotClient
    public constructor(discordBot: BotClient) {
        this.discordBot = discordBot
        this.queues = new Collection()
    }

    /**
     *
     * @param queue queue of the guild
     * @param songInfoId id of the song
     * @param seekTime time to seek to in milliseconds
     * @returns a discord audio resource
     */
    public getResource(queue: IQueue, songInfoId: string, seekTime: number) {
        try {
            let Qargs = ""
            const effects = queue.effects

            if (effects.normalizer) Qargs += `,dynaudnorm=f=200`
            if (effects.bassboost) Qargs += `,bass=g=${effects.bassboost}`
            if (effects.speed) Qargs += `,atempo=${effects.speed}`
            if (effects["3d"]) Qargs += `,apulsator=hz=0.03`
            if (effects.subboost) Qargs += `,asubboost`
            if (effects.mcompand) Qargs += `,mcompand`
            if (effects.haas) Qargs += `,haas`
            if (effects.gate) Qargs += `,agate`
            if (effects.karaoke) Qargs += `,stereotools=mlev=0.03`
            if (effects.flanger) Qargs += `,flanger`
            if (effects.pulsator) Qargs += `,apulsator=hz=1`
            if (effects.surrounding) Qargs += `,surround`
            if (effects.vaporwave) Qargs += `,aresample=48000,asetrate=48000*0.8`
            if (effects.nightcore) Qargs += `,aresample=48000,asetrate=48000*1.5`
            if (effects.phaser) Qargs += `,aphaser=in_gain=0.4`
            if (effects.tremolo) Qargs += `,tremolo`
            if (effects.vibrato) Qargs += `,vibrato=f=6.5`
            if (effects.reverse) Qargs += `,areverse`
            if (effects.treble) Qargs += `,treble=g=5`
            if (Qargs.startsWith(",")) Qargs = Qargs.substring(1)

            const encoderArgs = Qargs ? ["-af", Qargs] : ["-af", "bass=g=2,dynaudnorm=f=200"]

            const requestOpts: downloadOptions = {
                filter: "audioonly",
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
                // begin: seekTime,
                quality: "highestaudio"
            }

            if (this.discordBot.config.youtubeCookie && this.discordBot.config.youtubeCookie.length > 10) {
                requestOpts.requestOptions = {
                    headers: {
                        cookie: this.discordBot.config.youtubeCookie
                    }
                }
            }

            const readable = ytdl(getYTLink(songInfoId), requestOpts)
            if (!readable) throw new Error("No readable stream found")

            readable.on("error", err => Logger.error(err.message))
            readable.on("close", () => Logger.log("readable closed"))

            this.passThrought = new PassThrough()

            this.stream = FFmpeg(readable)
                .audioChannels(2)
                .audioBitrate(128)
                .audioFrequency(48000)
                .audioCodec("libmp3lame")
                .addOptions(encoderArgs)
                .seekInput(formatDuration(seekTime))
                .format("mp3")
                .output(this.passThrought)
                .on("error", err => null)
            this.stream.run()

            this.passThrought.on("error", () => readable.destroy())
            this.passThrought.on("close", () => {
                readable.destroy()
                this.stream = undefined
                this.passThrought = undefined
            })

            const resource = createAudioResource(this.passThrought)

            const volume = queue && queue.volume && queue.volume <= 100 && queue.volume > 1 ? queue.volume / 100 : 1
            resource.volume?.setVolume(volume)
            resource.playbackDuration = seekTime

            const playing = `${queue.tracks[0]?.title} / ${queue.tracks[0]?.channel?.name}`

            const user = this.discordBot.user
            if (user) {
                user.setPresence({
                    status: "online",
                    activities: [
                        {
                            name: playing,
                            type: ActivityType.Listening
                        }
                    ]
                })
            }
            Logger.log(`Playing ${playing}`)

            return resource
        } catch (e) {
            Logger.error(JSON.stringify(e))
            return null
        }
    }

    /**
     *
     * @param channel voice channel to play in
     * @param songInfo song to play
     * @returns a promise that resolves when the song is played
     */
    public async playSong(channel: VoiceChannel, songInfo: Video) {
        return new Promise((res, rej) => {
            const oldConnection = getVoiceConnection(channel.guildId)
            if (oldConnection) {
                if (oldConnection.joinConfig.channelId != channel.id) return rej("We aren't in the same channel!")
                try {
                    const curQueue = this.queues.get(channel.guildId)

                    if (!curQueue) return rej("No queue found")

                    const player = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Stop
                        }
                    })
                    oldConnection.subscribe(player)

                    if (!songInfo.id) return rej("No song id found")

                    const resource = this.getResource(curQueue, songInfo.id, 0)
                    if (!resource) return rej("No resource found")

                    player.play(resource)

                    player.on(AudioPlayerStatus.Playing, () => {
                        const queue = this.queues.get(channel.guildId)
                        if (queue && queue.filtersChanged) {
                            queue.filtersChanged = false
                        } else {
                            this.sendQueueUpdate(channel.guildId)
                        }
                    })

                    player.on(AudioPlayerStatus.Idle, () => {
                        const queue = this.queues.get(channel.guildId)
                        if (!queue || !queue.tracks || queue.tracks.length == 0) return
                        this.handleQueue(player, queue)
                    })

                    player.on("error", error => {
                        Logger.error(`Error, playing next song: ${error.message}`)
                        const queue = this.queues.get(channel.guildId)
                        if (!queue || !queue.tracks || queue.tracks.length == 0) return

                        this.handleQueue(player, queue)
                    })

                    return res(songInfo)
                } catch (e) {
                    console.error(e)
                    return rej(e)
                }
            } else {
                return rej("I'm not connected somwhere.")
            }
        })
    }

    /**
     * Sends an update to the queue
     * @param guildId id of the guild
     * @returns true
     */
    public async sendQueueUpdate(guildId: string) {
        const queue = this.queues.get(guildId)
        if (!queue || !queue.tracks || queue.tracks.length == 0) return false

        const channel =
            (await this.discordBot.channels.fetch(this.discordBot.config.baseChannelID).catch(err => Logger.error(err.message))) ||
            (await this.discordBot.channels.fetch(queue.textChannel).catch(err => Logger.error(err.message)))
        const textChannel = channel?.isTextBased() ? (channel as TextChannel) : null
        if (!textChannel) return false

        const song = queue.tracks[0]

        const songEmbed = new EmbedBuilder()
            .setColor(Colors.Fuchsia)
            .setTitle(`${song.title}`)
            .setURL(getYTLink(song.id ? song.id : ""))
            .addFields(
                {
                    name: `**Duration:**`,
                    value: `> \`${song.durationFormatted}\``,
                    inline: true
                },
                {
                    name: `**Requester:**`,
                    value: `> ${song.requester}`,
                    inline: true
                }
            )
        if (song?.thumbnail?.url) songEmbed.setImage(`${song?.thumbnail?.url}`)

        textChannel
            .send({
                embeds: [songEmbed]
            })
            .catch(console.warn)
        return true
    }

    /**
     *
     * @param song song to create
     * @param requester requester of the song
     * @returns the song with the requester
     */
    public createSong(song: Video, requester: User) {
        return { ...song, requester } as IESong
    }

    /**
     *
     * @param length length of the queue
     * @returns the position in the queue
     */
    public queuePos(length: number) {
        const str: { [key: number]: string } = {
            1: "st",
            2: "nd",
            3: "rd"
        }
        return `${length}${str[length % 10] ? str[length % 10] : "th"}`
    }

    /**
     *
     * @param length length of the queue
     * @returns a queue
     */
    public createQueue(song: Video, user: User, channelId: string, bitrate = 128) {
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
                treble: false
            },
            trackloop: false,
            queueloop: false,
            filtersChanged: false,
            volume: 15,
            tracks: [this.createSong(song, user)],
            previous: undefined,
            creator: user,
            bitrate: bitrate
        } as IQueue
    }

    /**
     * handle the queue
     * @param client client to use
     * @param player player to use
     * @param queue queue to use
     */
    public async handleQueue(player: AudioPlayer, queue: IQueue) {
        if (queue && !queue.filtersChanged) {
            try {
                player.stop()
                const user = this.discordBot.user
                if (user) {
                    user.setPresence({
                        status: "online",
                        activities: [
                            {
                                name: "for commands",
                                type: ActivityType.Watching
                            }
                        ]
                    })
                }
                if (queue && queue.tracks && queue.tracks.length > 1) {
                    queue.previous = queue.tracks[0]
                    if (queue.trackloop && !queue.skipped) {
                        if (queue.paused) queue.paused = false

                        const ressource = this.getResource(queue, queue.tracks[0].id, 0)
                        if (!ressource) return
                        player.play(ressource)
                    } else if (queue.queueloop && !queue.skipped) {
                        const skipped = queue.tracks.shift()
                        if (!skipped) return
                        queue.tracks.push(skipped)
                        if (queue.paused) queue.paused = false
                        const ressource = this.getResource(queue, queue.tracks[0].id, 0)
                        if (!ressource) return
                        player.play(ressource)
                    } else {
                        if (queue.skipped) queue.skipped = false
                        if (queue.paused) queue.paused = false
                        queue.tracks.shift()
                        const ressource = this.getResource(queue, queue.tracks[0].id, 0)
                        if (!ressource) return
                        player.play(ressource)
                    }
                } else if (queue && queue.tracks && queue.tracks.length <= 1) {
                    queue.previous = queue.tracks[0]
                    if (queue.trackloop || (queue.queueloop && !queue.skipped)) {
                        const ressource = this.getResource(queue, queue.tracks[0].id, 0)
                        if (!ressource) return
                        player.play(ressource)
                    } else {
                        if (queue.skipped) queue.skipped = false
                        queue.tracks = []
                    }
                }
            } catch (e) {
                Logger.error(JSON.stringify(e))
            }
        }
    }
}
