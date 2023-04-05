import { Collection, EmbedBuilder, Message, TextChannel } from "discord.js";
import { Logger } from "../../logger/Logger";
import BotClient from "../BotClient";
import { IReactionRole } from "../../types";

export default async function reactionCollector(client: BotClient) {
    const channelId = client.config.reactionRoleChannel;
    const reactionRoles = client.config.reactionRoles;
    if (!channelId || !reactionRoles) return;
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return Logger.error("Invalid reaction role channel ID");

    const messages = await channel.messages.fetch()

    if (messages.size === 0) {
        await createaMessage(channel, reactionRoles);
        return;
    }
    
    messages.forEach(message => {
        if (client.user && !(message.author.id !== client.user.id)) return;                            
        message.delete().then(async () => {
            await createaMessage(channel, reactionRoles);
        })
    });
    
}

async function createaMessage(channel: TextChannel, reactionRoles: IReactionRole[]) {
    const baseEmbed = new EmbedBuilder()
        .setAuthor({
            name: "Reaction Roles",
        })
        .setColor(0x00ff00)
        .setDescription("React to the message to get the role!")
        .setTimestamp(new Date());

    const newMessage = await channel.send({ embeds: [baseEmbed] })
    Logger.log("Reaction role message created");

    for (const {emoji} of reactionRoles) {
        newMessage.react(emoji);
    }

    const collector = newMessage.createReactionCollector({
        dispose: false,
    });

    collector.on("collect", (reaction, user) => {
        if (user.bot) return;
        const role = reactionRoles.find(role => role.emoji === reaction.emoji.name);
        if (!role) return Logger.error("Role not found");
        const member = reaction.message.guild?.members.cache.get(user.id);
        if (!member) return Logger.error("Member not found");
        member.roles.add(role.roleID);
    })

    collector.on("remove", (reaction, user) => {
        if (user.bot) return;
        const role = reactionRoles.find(role => role.emoji === reaction.emoji.name);
        if (!role) return Logger.error("Role not found");
        const member = reaction.message.guild?.members.cache.get(user.id);
        if (!member) return Logger.error("Member not found");
        member.roles.remove(role.roleID);
    })

    collector.on("end", () => {
        Logger.log("Reaction role collector ended");
    })

    collector.on("error", (error) => {
        Logger.error(error);
    })
}