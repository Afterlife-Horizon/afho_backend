import { SlashCommandBuilder, EmbedBuilder, GuildMember, Colors } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import bresil from "../../../functions/commandUtils/bresil/bresil"
require("dotenv").config()

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("bresil")
			.setDescription("Move member to bresil!")
			.addStringOption(option => option.setName("member").setDescription("member you want to move!").setRequired(true)),
		async execute(interaction) {
			try {
				const mover = interaction.member as GuildMember

				const messageMember = interaction.options.get("member")?.value as string
				const memberid = messageMember.replace(/\D/g, "")
				const guild = interaction.client.guilds.cache.get(client.config.serverID)
				const member = await guild?.members.fetch(memberid)
				if (!member) return await interaction.reply({ content: "❌ Member not found!" })

				const result = await bresil(client, mover, member)
				if (result.status !== 200) return await interaction.reply({ content: `❌ ${result.error}`, ephemeral: true })

				await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Green)
							.setAuthor({ name: mover.user.tag })
							.setDescription(result.message ? result.message : "Bresil moved!")
							.setTimestamp(new Date())
					]
				})
			} catch (err) {
				console.error(err)
				await interaction.reply({ content: `❌ An error occured!` })
			}
		}
	}
}
