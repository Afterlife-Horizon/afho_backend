import { Collection, EmbedBuilder, Message, TextChannel } from "discord.js";
import { Logger } from "../../logger/Logger";
import BotClient from "../BotClient";
import { IReactionRole } from "../../types";

export default async function reactionCollector(client: BotClient) {
    const channelId = client.config.reactionRoleChannel;
    const reactionRoles = client.config.reactionRoles;
    if (!channelId || !reactionRoles) return;

    const channel = await client.channels.fetch(channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return Logger.error("Invalid reaction role channel ID");

    const messages = await channel.messages.fetch()
    
    if (messages.size === 0) {
        await createMessage(client, channel, reactionRoles);
    }
    else {
        messages.forEach(message => {
            if (client.user && message.author.id !== client.user.id) return;                            
            message.delete().then(async () => {
                await createMessage(client, channel, reactionRoles);
            })
        });
    }
}

async function createMessage(client: BotClient, channel: TextChannel, reactionRoles: IReactionRole[]) {
    
    const baseEmbed = new EmbedBuilder()
        .setAuthor({
            name: "Reaction Roles",
        })
        .setColor(0x00ff00)
        .setDescription("React to the message to get the role!")
        .setTimestamp(new Date())
        .setFields(reactionRoles.map(reactionRole => {
            const emoji = client.emojis.cache.find(emoji => emoji.name === reactionRole.emojiName);
            if (!emoji) {
                Logger.error("Emoji not found");
                return { name: reactionRole.description, value: `Emoji not found: ${reactionRole.emojiName}`, inline: false}
            }

            const emojiString = emoji.toString();
            return {
                name: reactionRole.description,
                value: emojiString,
                inline: false,
            }
        }));

    const newMessage = await channel.send({ embeds: [baseEmbed] })
    Logger.log("Reaction role message created");

    for (const {emojiName} of reactionRoles) {

        const emoji = client.emojis.cache.find(emoji => emoji.name === emojiName);
        if (!emoji) return Logger.error("Emoji not found");

        newMessage.react(emoji);
    }

    const collector = newMessage.createReactionCollector({
        dispose: false,
    });

    collector.on("collect", async (reaction, user) => {
        if (user.bot) return;
        const reactionRole = reactionRoles.find(role => role.emojiName === reaction.emoji.name);
        if (!reactionRole) return Logger.error("Role not found");
        const member = await reaction.message.guild?.members.fetch(user.id);
        if (!member) return Logger.error("Member not found");

        const role = await reaction.message.guild?.roles.fetch(reactionRole.roleID);
        if (!role) return Logger.error("Role not found: " + reactionRole.roleID);

        if (member.roles.cache.has(role.id)) {
            member.roles.remove(role);
            Logger.log(`Removed role ${role.name} for user ${user.username}`);
        }
        else {
            member.roles.add(role);
            Logger.log(`Added role ${role.name} for user ${user.username} (${user.id}))`);
        }
        reaction.users.remove(user);
    })


    collector.on("end", () => {
        Logger.log("Reaction role collector ended");
    })

    collector.on("error", (error) => {
        Logger.error(error);
    })
}