import { Collection, EmbedBuilder, Message } from "discord.js";
import { Logger } from "../../logger/Logger";
import BotClient from "../BotClient";

export default async function (client: BotClient) {
    const channelId = client.config.reactionRoleChannel;
    const reactionRoles = client.config.reactionRoles;
    if (!channelId || !reactionRoles) return;
    const channel = client.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) return Logger.error("Invalid reaction role channel ID");

    const baseEmbed = new EmbedBuilder()
        .setAuthor({
            name: "Reaction Roles",
        })
        .setColor(0x00ff00)
        .setDescription("React to the message to get the role!")
        .setTimestamp(new Date());

    channel.messages.fetch().then((messages: Collection<string, Message>) => {
        messages.forEach(message => {
            if (client.user && !(message.author.id !== client.user.id)) return;                            

            message.delete().then(async () => {

                const newMessage = await message.channel.send({
                    embeds: [baseEmbed],
                })
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
            })
        });
    })
    
}