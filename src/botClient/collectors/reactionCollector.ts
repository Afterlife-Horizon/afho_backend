import { Colors, EmbedBuilder, Message, TextChannel } from "discord.js"
import { Logger } from "#/logger/Logger"
import type { IReactionRole } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default async function reactionCollector(client: BotClient) {
    Logger.log("Running reaction collector")
    const channelId = client.config.reactionRoleChannel
    const reactionRoles = client.config.reactionRoles
    if (!channelId || !reactionRoles) return

    const baseEmbed = new EmbedBuilder()
        .setAuthor({
            name: "React to the message to toggle the role!"
        })
        .setColor(Colors.Blue)
        .setFields(
            reactionRoles.map(reactionRole => {
                const emoji = client.emojis.cache.find(emoji => emoji.name === reactionRole.emojiName)
                if (!emoji) {
                    Logger.error("Emoji not found")
                    return {
                        name: reactionRole.description,
                        value: `Emoji not found: ${reactionRole.emojiName}`,
                        inline: false
                    }
                }

                const emojiString = emoji.toString()
                return {
                    name: reactionRole.description,
                    value: emojiString,
                    inline: false
                }
            })
        )

    const channel = (await client.channels.fetch(channelId)) as TextChannel
    if (!channel || !channel.isTextBased()) return Logger.error("Invalid reaction role channel ID")

    const messages = await channel.messages.fetch()

    if (messages.size > 1) {
        Logger.log("More than one reaction role message found, deleting all")
        messages.forEach(async message => {
            if (client.user && message.author.id !== client.user.id) return
            message.delete()
        })
    }
    if (messages.size === 0 || messages.size > 1) {
        Logger.log("No reaction role message found, creating one")
        const message = await channel.send({ embeds: [baseEmbed] })
        addReactions(client, message, reactionRoles)
        return await attachCollector(message, reactionRoles)
    }
    messages.forEach(async message => {
        if (client.user && message.author.id !== client.user.id) return

        Logger.log("Reaction role message found, updating")

        message.edit({ embeds: [baseEmbed] })
        addReactions(client, message, reactionRoles)
        await attachCollector(message, reactionRoles)
    })
    Logger.log("Reaction collector initialized")
}

async function attachCollector(message: Message, reactionRoles: IReactionRole[]) {
    const collector = message.createReactionCollector({
        dispose: false
    })

    collector.on("collect", async (reaction, user) => {
        if (user.bot) return
        const reactionRole = reactionRoles.find(role => role.emojiName === reaction.emoji.name)
        if (!reactionRole) return Logger.error("Role not found")
        const member = await reaction.message.guild?.members.fetch(user.id)
        if (!member) return Logger.error("Member not found")

        const role = await reaction.message.guild?.roles.fetch(reactionRole.roleID)
        if (!role) return Logger.error("Role not found: " + reactionRole.roleID)

        if (member.roles.cache.has(role.id)) {
            member.roles.remove(role)
            Logger.log(`Removed role ${role.name} for user ${user.username}`)
        } else {
            member.roles.add(role)
            Logger.log(`Added role ${role.name} for user ${user.username} (${user.id}))`)
        }
        reaction.users.remove(user)
    })

    collector.on("end", () => {
        Logger.log("Reaction role collector ended")
    })

    collector.on("error", error => {
        Logger.error(error)
    })
}

function addReactions(client: BotClient, message: Message, reactionRoles: IReactionRole[]) {
    message.reactions.removeAll()
    for (const { emojiName } of reactionRoles) {
        const emoji = client.emojis.cache.find(emoji => emoji.name === emojiName)
        if (!emoji) return Logger.error("Emoji not found")
        message.react(emoji)
    }
}
