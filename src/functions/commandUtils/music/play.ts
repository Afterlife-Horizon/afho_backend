import { getVoiceConnection } from "@discordjs/voice"
import YouTube, { Playlist, Video } from "youtube-sr"
import type BotClient from "#/botClient/BotClient"
import { isTextChannel, isVoiceChannel } from "#/functions/discordUtils"
import getSongNameFromSpotify from "#/functions/getInfoFromSpotify"
import { Logger } from "#/logger/Logger"
import type { IFunctionResponse } from "#/types"

export default async function play(client: BotClient, user: string, songs: string): Promise<IFunctionResponse> {
    try {
        const guild = client.guilds.cache.get(client.config.serverID)
        const requester = client.cacheHandler.connectedMembers.get(user)

        if (!guild) return { status: 406, error: "Guild not found!" }
        if (!requester)
            return {
                status: 406,
                error: "You are not connected to a voice channel!"
            }

        const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.find(m => m.user.username === requester.username) !== undefined)
        if (!voiceChannel)
            return {
                status: 406,
                error: "You are not connected to a voice channel!"
            }
        if (!isVoiceChannel(voiceChannel))
            return {
                status: 406,
                error: "You are not connected to a voice channel!"
            }
        client.voiceHandler.currentChannel = voiceChannel

        const channel = client.channels.cache.get(client.config.baseChannelID)
        if (!channel) return { status: 406, error: "Could not find the base channel!" }
        if (!isTextChannel(channel)) return { status: 406, error: "Could not find the base channel!" }

        let queue = client.musicHandler.queues.get(client.voiceHandler.currentChannel.guildId)
        const oldConnection = getVoiceConnection(client.voiceHandler.currentChannel.guildId)

        if (!oldConnection) {
            try {
                await client.voiceHandler.joinVoiceChannel(client.voiceHandler.currentChannel)
            } catch (err) {
                Logger.error(err)
                return { status: 406, error: `Could not join Voice Channel!` }
            }
        }

        const botsVoiceChanel = client.voiceHandler.currentChannel
        if (botsVoiceChanel?.id !== voiceChannel.id && oldConnection) return { status: 406, error: "Not the same channel!" }

        const args = songs.split(" ")
        const track = args.join(" ")

        const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi
        const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi
        const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi

        const spotifyRegex = /^.*(open\.spotify\.com)\/.+$/gi
        const spotifySongRegex = /^(https:\/\/open.spotify.com\/(track\/))(.*)$.*/gi
        const spotifyPlaylistRegex = /^(.*)$|https:\/\/open.spotify.com\/playlist\/([a-zA-Z0-9]+)(.*)$.*/gi

        let song: Video | undefined = undefined
        let playList: Playlist | undefined = undefined

        const isYoutube = youtubRegex.exec(track)
        const isYoutubeSong = songRegex.exec(track)
        const isYoutubePlaylist = playlistRegex.exec(track)

        const isSpotify = spotifyRegex.exec(track)
        const isSpotifySong = spotifySongRegex.exec(track)
        const isSpotifyPlaylist = spotifyPlaylistRegex.exec(track)

        channel.send({ content: `Searching ${track} ...` })
        if (!oldConnection && queue) {
            client.musicHandler.queues.delete(client.voiceHandler.currentChannel.guildId)
            queue = undefined
        }

        if (!isYoutube && !isSpotify) {
            return {
                status: 406,
                error: `Please enter a valid youtube or spotify link!`
            }
        }

        if (isYoutube) {
            if (isYoutube && isYoutubeSong && !isYoutubePlaylist) {
                song = await YouTube.getVideo(track)
            } else if (isYoutube && isYoutubePlaylist && !isYoutubeSong) {
                playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch())
            } else if (isYoutube && isYoutubePlaylist && isYoutubeSong) {
                song = await YouTube.getVideo(track)
                playList = await YouTube.getPlaylist(track).then(playlist => playlist.fetch())
            } else {
                song = await YouTube.searchOne(track)
            }
        } else if (isSpotify) {
            if (isSpotifySong && !isSpotifyPlaylist) {
                const spotifyInfo = await getSongNameFromSpotify(client, track)
                song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
            } else if (isSpotifyPlaylist && !isSpotifySong)
                return {
                    status: 406,
                    error: `Spotify playlists are not supported yet!`
                }
            else if (isSpotifyPlaylist && isSpotifySong) {
                const spotifyInfo = await getSongNameFromSpotify(client, track)
                song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
            } else {
                const spotifyInfo = await getSongNameFromSpotify(client, track)
                song = await YouTube.searchOne(`${spotifyInfo.artists[0].name} - ${spotifyInfo.name}`)
            }
        }

        if (song === null && playList === null) {
            channel.send({ content: `No song were found!` })
            return { status: 400, error: "no songs found" }
        }
        if (!playList) {
            const video = song as Video

            if (!queue || queue.tracks.length == 0) {
                const bitrate = 128
                const newQueue = client.musicHandler.createQueue(video, requester, client.voiceHandler.currentChannel.guildId, bitrate)
                client.musicHandler.queues.set(client.voiceHandler.currentChannel.guildId, newQueue)
                await client.musicHandler.playSong(client.voiceHandler.currentChannel, video)

                channel.send({
                    content: `Now playing : ${video.title} - ${video.durationFormatted}!`
                })
                return { status: 200, message: "OK" }
            }
            queue.tracks.push(client.musicHandler.createSong(video, requester))
            channel.send({
                content: `Added : ${video.title} - ${video.durationFormatted}!`
            })
            return { status: 200, message: "OK" }
        } else {
            song = song ? song : playList.videos[0]

            const video = song
            const index = playList.videos.findIndex(s => s.id == video.id) || 0
            playList.videos.splice(0, index + 1)

            if (!queue || queue.tracks.length == 0) {
                const bitrate = 128
                const newQueue = client.musicHandler.createQueue(song, requester, client.config.baseChannelID, bitrate)
                playList.videos.forEach(nsong => newQueue.tracks.push(client.musicHandler.createSong(nsong, requester)))
                client.musicHandler.queues.set(client.voiceHandler.currentChannel.guildId, newQueue)

                await client.musicHandler.playSong(client.voiceHandler.currentChannel, video)

                channel.send({
                    content: `Now playing : ${video.title} - ${video.durationFormatted} - from playlist: ${playList.title}`
                })
                return { status: 200, message: "OK" }
            }

            if (!client.musicHandler.queues.get(client.voiceHandler.currentChannel.guildId))
                client.musicHandler.queues.set(
                    client.voiceHandler.currentChannel.guildId,
                    client.musicHandler.createQueue(song, requester, client.config.baseChannelID, 128)
                )
            queue = client.musicHandler.queues.get(client.voiceHandler.currentChannel.guildId)

            if (!queue) return { status: 406, error: `Could not play song!` }

            playList.videos.forEach(nsong => queue?.tracks.push(client.musicHandler.createSong(nsong, requester)))

            channel.send(
                `Queued at \`${client.musicHandler.queuePos(queue.tracks.length - (playList.videos.length - 1))}\`: __${video.title} - \`${
                    video.durationFormatted
                }\`\n> Added \`${playList.videos.length - 1} Songs\` from the Playlist:\n> ${playList.title}`
            )
            return { status: 200, message: "OK" }
        }
    } catch (err) {
        Logger.error(err)
        return { status: 406, error: `Could not play song!` }
    }
}
