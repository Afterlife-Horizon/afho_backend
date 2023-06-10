import {
	AudioPlayer,
	AudioPlayerStatus,
	CreateVoiceConnectionOptions,
	JoinVoiceChannelOptions,
	NoSubscriberBehavior,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	getVoiceConnection,
	joinVoiceChannel
} from "@discordjs/voice"
import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { ActivityType, Client, ClientOptions, Collection, Colors, EmbedBuilder, TextChannel, User, VoiceChannel, VoiceState } from "discord.js"
import FFmpeg from "fluent-ffmpeg"
import fs from "node:fs"
import path from "node:path"
import Parser from "rss-parser"

import { PrismaClient, Videos } from "@prisma/client"
import { PassThrough } from "node:stream"
import { Video } from "youtube-sr"
import ytdl, { downloadOptions } from "ytdl-core"
import { reactionRoles } from "../constante"
import { Logger } from "../logger/Logger"
import interactionCreate from "./listeners/interactionCreate"
import messageCreate from "./listeners/messageCreate"
import voiceStateUpdate from "./listeners/voiceStateUpdate"

import getLevelFromXp from "../functions/getLevelFromXp"
import type { Fav, Favorite, IClientConfig, ICommand, IEnv, Time, Xp } from "../types"
import type { IESong, IQueue } from "../types/music"
import { isTextChannel } from "../functions/discordUtils"

export default class BotClient extends Client {
	public currentChannel: VoiceChannel | null
	public prisma: PrismaClient
	public config: IClientConfig
	public commands: Map<string, ICommand>
	public queues: Map<string, IQueue>
	public favs: Map<string, Videos[]>
	public connectedMembers: Map<string, User>
	public ready: boolean
	public passThrought?: PassThrough
	public stream?: FFmpeg.FfmpegCommand
	public supabaseClient: SupabaseClient<any, "public", any>
	public times: Map<string, Date>
	public timeValues: Map<string, Time>
	public xps: Map<string, Xp>

	constructor(options: ClientOptions, environment: IEnv) {
		super(options)
		this.ready = false
		this.config = environment

		if (environment.reactionRoleChannel) this.config.reactionRoles = reactionRoles

		this.prisma = new PrismaClient()
		this.commands = new Collection()
		this.queues = new Collection()
		this.favs = new Collection()
		this.connectedMembers = new Collection()
		this.xps = new Collection()
		this.timeValues = new Collection()

		this.initCommands()
		this.initListeners()
		this.getSpotifyToken()
		this.currentChannel = null
		this.supabaseClient = createClient(this.config.supabaseURL, this.config.supabaseKey)
		this.times = new Map()
	}

	async stop() {
		const connection = getVoiceConnection(this.config.serverID)
		if (connection) connection.disconnect()

		for (const [id] of this.times) await this.pushTime(id)

		this.destroy()
	}

	async pushTime(id: string) {
		const time = this.times.get(id)
		if (!time) return

		const timeSpent = new Date().getTime() - time.getTime()
		const timeSpentSeconds = Math.round(timeSpent / 1000)

		const member = await this.guilds.fetch(this.config.serverID).then(guild => guild.members.fetch(id))
		if (!member) return

		await this.prisma.time_connected.upsert({
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
			}
		})
	}

	async updateGameFeeds() {
		if (this.config.ff14NewsChannelID) {
			const textChannel = await this.channels.fetch(this.config.ff14NewsChannelID)
			if (!textChannel) return Logger.error("The ff14 news channel is not found")
			if (!isTextChannel(textChannel)) return Logger.error("The ff14 news channel is not a text channel")

			const paser = new Parser()
			const feed = await paser.parseURL("https://fr.finalfantasyxiv.com/lodestone/news/news.xml")

			const lastNews = feed.items[0]
			const title = lastNews.title
			const link = lastNews.link
			const author = lastNews.author
			const dataString = lastNews.isoDate
			if (!dataString) return
			const date = new Date(dataString)
			const image = "https://lodestonenews.com/images/logo.png"

			if (!title || !link) return

			const message = new EmbedBuilder()
				.setTitle(title)
				.setThumbnail(image)
				.setDescription(lastNews.contentSnippet?.replace("<br>\n", "\n").slice(0, 2000) || null)
				.setAuthor({ name: author || null })
				.setColor(Colors.Blue)
				.setTimestamp(date)
				.setURL(link)

			const lastMessage = (await textChannel.messages.fetch()).filter(m => m.author.id === this.user?.id).first()
			if (!lastMessage) {
				await textChannel
					.send({
						embeds: [message]
					})
					.catch(Logger.error)
			} else {
				const messageTimeStamp = lastMessage.createdAt.getTime()
				const dateTimeStamp = date.getTime()

				if (dateTimeStamp > messageTimeStamp)
					await textChannel
						.send({
							embeds: [message]
						})
						.catch(Logger.error)
			}
		}
	}

	async initVars() {
		const guild = await this.guilds.fetch(this.config.serverID)
		const connectedMembers = await guild.members.fetch().then(m => m.filter(m => m.voice.channel).map(m => m.user))
		connectedMembers.forEach(user => {
			this.connectedMembers.set(user.id, user)
			if (!user.bot) this.times.set(user.id, new Date())
		})
		this.updateCache()
	}

	async getSpotifyToken() {
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

	private initListeners() {
		interactionCreate(this)
		messageCreate(this)
		voiceStateUpdate(this)
	}

	async updateCache() {
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
	}

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
	 *
	 * @param ms time in milliseconds
	 * @returns string of the given time in minutes:seconds format
	 */
	public formatDuration(ms: number) {
		let sec = Math.floor((ms / 1000) % 60)
		let min = Math.floor((ms / (1000 * 60)) % 60)
		const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24)
		if (sec >= 60) sec = 0
		if (min >= 60) min = 0
		if (hrs > 1) return `${this.m2(hrs)}:${this.m2(min)}:${this.m2(sec)}`
		return `${this.m2(min)}:${this.m2(sec)}`
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
	 *
	 * @returns string of the current time in hours:minutes:seconds.milliseconds format
	 */
	public getTime() {
		const date = new Date()
		return `${this.m2(date.getHours())}:${this.m2(date.getMinutes())}:${this.m2(date.getSeconds())}.${this.m3(date.getMilliseconds())}`
	}

	/**
	 *
	 * @param id youtube video id
	 * @returns the youtube link of the given id
	 */
	public getYTLink(id: string) {
		return `https://www.youtube.com/watch?v=${id}`
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
				this.queues.delete(channel.guild.id)
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

			if (this.config.youtubeCookie && this.config.youtubeCookie.length > 10) {
				requestOpts.requestOptions = {
					headers: {
						cookie: this.config.youtubeCookie
					}
				}
			}

			const readable = ytdl(this.getYTLink(songInfoId), requestOpts)
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
				.seekInput(this.formatDuration(seekTime))
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

			const user = this.user
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
			(await this.channels.fetch(this.config.baseChannelID).catch(err => Logger.error(err.message))) ||
			(await this.channels.fetch(queue.textChannel).catch(err => Logger.error(err.message)))
		const textChannel = channel?.isTextBased() ? (channel as TextChannel) : null
		if (!textChannel) return false

		const song = queue.tracks[0]

		const songEmbed = new EmbedBuilder()
			.setColor(Colors.Fuchsia)
			.setTitle(`${song.title}`)
			.setURL(this.getYTLink(song.id ? song.id : ""))
			.addFields(
				{ name: `**Duration:**`, value: `> \`${song.durationFormatted}\``, inline: true },
				{ name: `**Requester:**`, value: `> ${song.requester}`, inline: true }
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
	 *
	 * @param ms time to delay
	 * @returns a promise that resolves after the time
	 */
	public async delay(ms: number) {
		return new Promise(r => setTimeout(() => r(2), ms))
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
				const user = this.user
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

	private m2(t: number) {
		return t < 10 ? `0${t}` : `${t}`
	}
	private m3(t: number) {
		return t < 100 ? `0${this.m2(t)}` : `${t}`
	}
}
