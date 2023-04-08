import { GuildMember, SlashCommandBuilder } from "discord.js"
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("speed")
			.setDescription("Set the speed of the song!")
			.addStringOption(option => option.setName("speed").setDescription("The speed you would like! (in %)").setRequired(true)),
		async execute(interaction) {
			const member = interaction.member as GuildMember
			const guild = interaction.guild
			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			const oldConnection = getVoiceConnection(interaction.guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**")
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(interaction.guild.id)
			if (!queue) {
				return interaction.reply(`👎 **Nothing playing right now**`)
			}

			const arg = interaction.options.get("speed")?.value as number
			if (arg === undefined || isNaN(arg) || Number(arg) < 50 || Number(arg) > 300)
				return interaction
					.reply(`👎 **No __valid__ Bassboost-Level between 50 and 300 % provided!** (100 % == normal speed)\n Usage: \`/speed 125\``)
					.catch(err => Logger.error(err.message))
			const speed = Number(arg)
			queue.effects.speed = Math.floor(speed) / 100
			queue.filtersChanged = true

			const state = oldConnection.state as VoiceConnectionReadyState
			if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

			const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState
			if (!playerState || !playerState.resource || !playerState.resource.volume)
				return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))

			const curPos = playerState.resource?.playbackDuration || 0
			state.subscription.player.stop()
			const resource = client.getResource(queue, queue.tracks[0].id, curPos)
			if (!resource) return interaction.reply(`👎 **Something went wrong**`).catch(err => Logger.error(err.message))
			state.subscription.player.play(resource)

			return interaction
				.reply(`🎚 **Successfully changed the Speed to \`${Math.floor(speed) / 100}x\` of the Original Speed (${speed}%)**`)
				.catch(err => Logger.error(err.message))
		}
	}
}
