import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { GuildMember, TextChannel } from "discord.js"
import type BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"
import type { IFunctionResponse } from "#/types"

interface IArgs {
    member: GuildMember
}

export default async function changeFilters(client: BotClient, args: IArgs): Promise<IFunctionResponse> {
    try {
        const member = args.member
        const guild = await client.guilds.fetch(member.guild.id)
        const channel = (await client.channels.fetch(client.config.baseChannelID)) as TextChannel
        if (!member || !guild || !channel) return { status: 500, error: `Something went wrong` }

        if (!member.voice.channelId)
            return {
                status: 400,
                error: "👎 **Please join a Voice-Channel first!**"
            }

        const oldConnection = getVoiceConnection(guild.id)
        if (!oldConnection) return { status: 400, error: `👎 **I'm not connected somewhere**!` }

        const state = oldConnection.state as VoiceConnectionReadyState
        if (!state || !state.subscription) return { status: 400, error: `👎 **Something went wrong**` }

        const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState
        if (!playerState || !playerState.resource) return { status: 400, error: `👎 **Something went wrong**` }

        const queue = client.musicHandler.queues.get(guild.id)
        if (!queue)
            return {
                status: 400,
                error: `👎 **I'm nothing playing right now.**`
            }

        queue.filtersChanged = true
        const curPos = playerState.resource.playbackDuration

        state.subscription?.player.stop()
        const resource = client.musicHandler.getResource(queue, queue.tracks[0].id, curPos)
        if (!resource) return { status: 400, error: `👎 **Something went wrong**` }
        state.subscription?.player.play(resource)

        return { status: 200 }
    } catch (e: any) {
        Logger.error(e)
        return { status: 500, error: `❌ Something went wrong` }
    }
}
