import type BotClient from "#/botClient/BotClient"
import type { IFunctionResponse } from "#/types"

export default async function disconnect(client: BotClient): Promise<IFunctionResponse> {
    try {
        if (!client.voiceHandler.currentChannel) return { status: 400, error: "not connected!" }
        await client.voiceHandler.leaveVoiceChannel(client.voiceHandler.currentChannel)
        return { status: 200, message: "disconnected" }
    } catch (err) {
        console.error(err)
        return { status: 500, message: "Internal error!" }
    }
}
