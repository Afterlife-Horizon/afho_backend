import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"
import reactionCollector from "#/botClient/collectors/reactionCollector"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("addreactionrole")
            .setDescription("Add a reaction role to the server")
            .addStringOption(option => option.setName("roleid").setDescription("role ID here").setRequired(true))
            .addStringOption(option => option.setName("emoji").setDescription("emoji here").setRequired(true))
            .addStringOption(option => option.setName("description").setDescription("Role Description here").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
        async execute(interaction) {
            const options = interaction.options
            const roleID = options.get("roleid")?.value as string
            const emoji = options.get("emoji")?.value as string
            const description = options.get("description")?.value as string

            const role = await interaction.guild?.roles.fetch(roleID)
            if (!role) return interaction.reply("Role not found")

            const reactionRole = {
                roleID: roleID,
                emojiName: emoji,
                description: description
            }

            client.config.reactionRoles?.push(reactionRole)

            await client.prisma.role_assignment.create({
                data: {
                    roleID: roleID,
                    emojiName: emoji,
                    description: description
                }
            })

            reactionCollector(client)
            interaction.reply("Reaction role added")
        }
    }
}
