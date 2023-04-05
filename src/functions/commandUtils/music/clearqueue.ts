import { getVoiceConnection } from "@discordjs/voice"
import { GuildMember, TextChannel } from "discord.js"
import BotClient from "../../../botClient/BotClient"
import { IFunctionResponse } from "../../../types"
import { Logger } from "../../../logger/Logger"

interface IArgs {
	member: GuildMember
}

export default async function clearQueue(client: BotClient, args: IArgs): Promise<IFunctionResponse> {
	try {
		const member = args.member
		const guild = client.guilds.cache.get(member.guild.id)
		const channel = (await client.channels.fetch(client.config.baseChannelID)) as TextChannel
		if (!channel || !member || !guild) return { status: 500, error: `Something went wrong` }

		if (!member.voice.channelId) return { status: 400, error: "👎 **Please join a Voice-Channel first!**" }

		const oldConnection = getVoiceConnection(guild.id)
		if (!oldConnection) return { status: 400, error: "👎 **I'm not connected somewhere!**" }
		if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
			return { status: 400, error: "👎 **We are not in the same Voice-Channel**!" }

		const queue = client.queues.get(guild.id)
		if (!queue) {
			return { status: 400, error: `👎 **Nothing playing right now**` }
		}

		queue.tracks = [queue.tracks[0]]

		return { status: 200, message: `👍 **Successfully cleared the Queue**` }
	} catch (err) {
		if (err instanceof Error) Logger.error(err.message)
		return { status: 500, error: `👎 **Something went wrong**` }
	}
}
