import { getVoiceConnection, VoiceConnectionReadyState } from "@discordjs/voice"
import type BotClient from "#/botClient/BotClient"

export default function pause(client: BotClient, user: string) {
    const guild = client.guilds.cache.get(client.config.serverID)
    const connectedMembers = guild?.members.cache.filter(member => member.voice.channel)
    const member = connectedMembers?.find(member => member.user.username === user)

    if (!member || !guild) return { status: 500, error: "👎 **Something went wrong**" }
    if (!member.voice.channelId)
        return {
            status: 400,
            error: "👎 **Please join a Voice-Channel first!**"
        }

    const oldConnection = getVoiceConnection(guild.id)
    if (!oldConnection) return { status: 400, error: "👎 **I'm not connected somewhere!**" }
    if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
        return {
            status: 400,
            error: "👎 **We are not in the same Voice-Channel**!"
        }

    const queue = client.musicHandler.queues.get(guild.id)
    if (!queue) return { status: 400, error: `👎 **Nothing playing right now**` }

    if (!queue.paused) return { status: 400, error: `👎 **Track already playing**` }

    const state = oldConnection.state as VoiceConnectionReadyState
    if (!state || !state.subscription) return { status: 400, error: `👎 **Something went wrong**` }

    state.subscription.player.unpause()
    queue.paused = false

    return { status: 200, message: `⏸️ **Successfully resumed the Track**` }
}
