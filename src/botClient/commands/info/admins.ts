import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ApplicationCommand, CommandInteraction } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("admins").setDescription("Lists all admins!"),
		async execute(interaction: CommandInteraction) {
			const guild = interaction.guild
			if (!guild) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true })
			await guild.members.fetch()

			const membersWithRole = guild.roles.cache.get(client.config.adminRoleId)?.members

			const ListEmbed = new EmbedBuilder()
				.setTitle("Users with the admin role:")
				.setDescription(membersWithRole ? membersWithRole.map(m => m.user.tag).join("\n") : "No admins found!")
			interaction.reply({ embeds: [ListEmbed] })
		}
	}
}
