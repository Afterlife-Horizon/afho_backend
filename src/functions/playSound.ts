import BotClient from "../botClient/BotClient"
import { Message } from "discord.js"
import { isVoiceChannel } from "./discordUtils"
import { AudioPlayerStatus, VoiceConnectionStatus, createAudioPlayer, createAudioResource, getVoiceConnection } from "@discordjs/voice"
import { Logger } from "../logger/Logger"
import path from "node:path"

export async function playSound(client: BotClient, message: Message, sound: string) {
    if (client.queues[client.config.serverID]?.tracks.length > 0) return

    const guild = client.guilds.cache.get(client.config.serverID)
    const requester = client.connectedMembers.get(message.author.id)

    if (!guild || !requester) return

    const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.find(m => m.user.username === requester.username) !== undefined)
    if (!voiceChannel) return
    if (!isVoiceChannel(voiceChannel)) return
    client.currentChannel = voiceChannel

    let connection = getVoiceConnection(client.currentChannel.guildId)
    try {
        if (connection) connection.destroy()
        await client.joinVoiceChannel(client.currentChannel)
        connection = getVoiceConnection(client.currentChannel.guildId)
    } catch (err) {
        Logger.error(err)
        return
    }

    if (!connection) return

    const player = createAudioPlayer()
    connection.subscribe(player)

    connection.on(VoiceConnectionStatus.Ready, () => {
        const soundPath = path.join(__dirname, `../assets/sounds/${sound}.mp3`)
        const resource = createAudioResource(soundPath)
        player.play(resource)
    })

    player.addListener(AudioPlayerStatus.Idle, () => {
        Logger.log("Sound finished playing!")
        connection?.destroy()
    })

    connection.on("error", err => {
        Logger.error(err)
    })
}