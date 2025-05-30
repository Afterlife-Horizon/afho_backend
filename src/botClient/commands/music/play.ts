import { GuildMember, SlashCommandBuilder } from "discord.js"
import play from "#/functions/commandUtils/music/play"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

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
