import { GuildMember, SlashCommandBuilder } from "discord.js"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import play from "../../../functions/commandUtils/music/play"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("play")
			.setDescription("Plays a youtube video/song!")
			.addStringOption(option => option.setName("song").setDescription("Enter a song or a playlist!").setRequired(true)),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const track = interaction.options.get("song")?.value as string

			const result = await play(client, member.user.username, track)
			if (!result.message) return await interaction.reply({ content: result.error })
			return await interaction.reply({ content: result.message })
		}
	}
}
