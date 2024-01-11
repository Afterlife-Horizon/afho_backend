import { Channel, ChannelType, GuildBasedChannel, TextChannel, VoiceChannel } from "discord.js"

export function isVoiceChannel(channel: Channel | GuildBasedChannel): channel is VoiceChannel {
    return channel.type === ChannelType.GuildVoice
}

export function isTextChannel(channel: Channel): channel is TextChannel {
    return channel.type === ChannelType.GuildText
}
