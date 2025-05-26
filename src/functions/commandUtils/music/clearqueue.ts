import { getVoiceConnection } from "@discordjs/voice"
import { GuildMember } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import { isTextChannel } from "#/functions/discordUtils"
import { Logger } from "#/logger/Logger"
import type { IFunctionResponse } from "#/types"

export default async function clearQueue(client: BotClient, args: { member: GuildMember }): Promise<IFunctionResponse> {
    try {
        const member = args.member
        const guild = await client.guilds.fetch(member.guild.id)
        const channel = client.channels.cache.get(client.config.baseChannelID)
        if (!channel || !member || !guild) return { status: 500, error: `Something went wrong` }
        if (!isTextChannel(channel)) return { status: 500, error: `Something went wrong` }

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

        queue.tracks = [queue.tracks[0]]

        return { status: 200, message: `👍 **Successfully cleared the Queue**` }
    } catch (err) {
        Logger.error(err)
        return { status: 500, error: `👎 **Something went wrong**` }
    }
}
