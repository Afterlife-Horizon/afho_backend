import { Events } from "discord.js"
import { handleAchievements } from "#/functions/handleAchievements"
import handleGPTChat from "#/functions/handleGPTChat"
import { playSound } from "#/functions/playSound"
import { Logger } from "#/logger/Logger"
import { AchievementType } from "#/types/achievements"
import BotClient from "#/botClient/BotClient"

require("dotenv").config()

export default function (client: BotClient) {
    return client.on(Events.MessageCreate, async message => {
        if (message.author.bot) return

        const member = message.member
        if (!member) return
        await client.cacheHandler.updateDBUser(member)

        client.prisma.levels
            .upsert({
                where: {
                    user_id: message.author.id
                },
                update: {
                    xp: {
                        increment: 1
                    }
                },
                create: {
                    user_id: message.author.id,
                    xp: 1
                },
                select: {
                    xp: true
                }
            })
            .then(async res => {
                const messageCount = res.xp
                await handleAchievements(client, AchievementType.MESSAGE, message.author.id, messageCount)
            })
            .catch(Logger.error)

        if (client.config.funnySound && !message.content.includes("http")) {
            for (const [word, path] of client.cacheHandler.sounds) {
                if (message.content.toLowerCase().includes(word)) {
                    Logger.log(`Playing sound ${path}`)
                    playSound(client, message, path)
                    break
                }
            }
        }

        handleGPTChat(client, message)
    })
}
