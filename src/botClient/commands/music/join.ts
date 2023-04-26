import { GuildMember, SlashCommandBuilder, VoiceChannel } from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import type BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("join").setDescription("Joins the voice channel!"),
		async execute(interaction) {
			try {
				const member = interaction.member as GuildMember
				const guild = interaction.guild

				if (!member || !guild) return await interaction.reply({ content: `Something went wrong` })

				const oldConnection = getVoiceConnection(guild.id)
				if (oldConnection) return await interaction.reply({ content: `i'm already in a channel: <#${oldConnection.joinConfig.channelId}>!` })
				if (!member.voice.channelId) return await interaction.reply({ content: `Please join a voice channel first` })
				const voiceChannel = member.voice.channel as VoiceChannel

				if (!voiceChannel) return await interaction.reply({ content: `Something went wrong` })

				await client.joinVoiceChannel(voiceChannel)
				client.currentChannel = voiceChannel
				await interaction.reply({ content: `joined voice channel!` })
			} catch (err) {
				Logger.error(JSON.stringify(err))
				interaction.reply({ content: `Could not join voice channel` })
			}
		}
	}
}
