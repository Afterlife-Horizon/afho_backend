import { getVoiceConnection, VoiceConnectionReadyState, AudioPlayerPlayingState, AudioPlayerPausedState } from "@discordjs/voice";
import { GuildMember, StringSelectMenuBuilder, ActionRowBuilder, SelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, Colors, TextChannel } from "discord.js";
import BotClient from "../../botClient/BotClient";
import { IFilters, IFunctionResponse } from "../../types";

interface IArgs {
    member: GuildMember;
}

export default async function changeFilters(client: BotClient, args: IArgs) : Promise<IFunctionResponse> {
    try {
        const member = args.member
        const guild = client.guilds.cache.get(member.guild.id)
        const channel = await client.channels.fetch(process.env.BASE_CHANNEL_ID || "") as TextChannel;
        if (!member || !guild || !channel) return { status: 500, error: `Something went wrong` }

        if (!member.voice.channelId) return { status: 400, error: "👎 **Please join a Voice-Channel first!**" }

        const oldConnection = getVoiceConnection(guild.id)
        if (!oldConnection) return { status: 400, error: `👎 **I'm not connected somewhere**!` }

        const state = oldConnection.state as VoiceConnectionReadyState;
        if (!state || !state.subscription) return { status: 400, error: `👎 **Something went wrong**` }

        const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
        if (!playerState || !playerState.resource || !playerState.resource.volume) return { status: 400, error: `👎 **Something went wrong**`}      

        const queue = client.queues.get(guild.id)
        if (!queue) return { status: 400, error: `👎 **I'm nothing playing right now.**` }

        queue.filtersChanged = true;
        const curPos = playerState.resource.playbackDuration;
        state.subscription?.player.stop();
        state.subscription?.player.play(client.getResource(queue, queue.tracks[0].id, curPos));

        return { status: 200 }
    }
    catch (e: any) {
        console.error(e);
        return { status: 500, error: `❌ Something went wrong` }
    }
}