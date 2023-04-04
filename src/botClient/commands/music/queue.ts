import {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildMember,
	Colors,
	APIActionRowComponent,
	APIMessageActionRowComponent,
	APITextInputComponent,
	APIButtonComponent
} from "discord.js"
import { getVoiceConnection } from "@discordjs/voice"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
import { Logger } from "../../../logger/Logger"

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder().setName("queue").setDescription("shows the queue!"),
		async execute(interaction) {
			const guild = interaction.guild
			const member = interaction.member as GuildMember
			if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
			if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

			const oldConnection = getVoiceConnection(guild.id)
			if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
			if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
				return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

			const queue = client.queues.get(interaction.guild.id)
			if (!queue || !queue.tracks || !queue.tracks[0]) {
				return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
			}
			const e2n = s => (s ? "✅ Enabled" : "❌ Disabled")
			const song = queue.tracks[0]

			let i = 10

			const queueEmbed = new EmbedBuilder()
				.setColor(Colors.Fuchsia)
				.setTitle(`First 10 Songs in the Queue`)
				.setDescription(
					`**CURRENT:** \`${song.durationFormatted}\` - [${song.title}](${client.getYTLink(song.id ? song.id : "")}) - ${song.requester}`
				)
				.addFields(
					{ name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
					{ name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
					{ name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true }
				)
				.addFields(
					queue.tracks
						.slice(1)
						.slice(i - 10, i)
						.map((track, index) => {
							return {
								name: `Track \`${client.queuePos(index + 1)}\` - \`${track.durationFormatted}\``,
								value: `> [${track.title}](${client.getYTLink(track.id ? track.id : "")}) - ${track.requester}`,
								inline: false
							}
						})
				)

			const buttons = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(new ButtonBuilder().setCustomId("mprev").setLabel("⏮start").setStyle(ButtonStyle.Primary))
				.addComponents(new ButtonBuilder().setCustomId("prev").setLabel("⬅ prev").setStyle(ButtonStyle.Primary))
				.addComponents(new ButtonBuilder().setCustomId("next").setLabel("next ➡").setStyle(ButtonStyle.Primary))
				.addComponents(new ButtonBuilder().setCustomId("mnext").setLabel("last⏭").setStyle(ButtonStyle.Primary))

			const msg = await interaction
				.reply({
					content: `ℹ️ **Currently there are ${queue.tracks.length - 1} Tracks in the Queue**`,
					embeds: [queueEmbed],
					components: [buttons]
				})
				.catch(err => Logger.error(err.message))

			if (!msg) return

			const nextCollector = msg.createMessageComponentCollector({
				filter: inn => inn.customId == "next" && inn.user.id == interaction.user.id,
				time: 120000
			})

			nextCollector.on("collect", async ninteraction => {
				if (i < queue.tracks.length) i += 10
				await ninteraction.update({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Fuchsia)
							.setTitle(`Songs in the Queue`)
							.setDescription(
								`**CURRENT:** \`${song.durationFormatted}\` - [${song.title}](${client.getYTLink(song.id ? song.id : "")}) - ${
									song.requester
								}`
							)
							.addFields(
								{ name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
								{ name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
								{ name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true }
							)
							.addFields(
								queue.tracks
									.slice(1)
									.slice(i - 10, i)
									.map((track, index) => {
										return {
											name: `Track \`${client.queuePos(index + i - 9)}\` - \`${track.durationFormatted}\``,
											value: `> [${track.title}](${client.getYTLink(track.id ? track.id : "")}) - ${track.requester}`,
											inline: false
										}
									})
							)
					],
					components: [buttons]
				})
			})

			const prevCollector = msg.createMessageComponentCollector({
				filter: inn => inn.customId == "prev" && inn.user.id == interaction.user.id,
				time: 120000
			})

			prevCollector.on("collect", async ninteraction => {
				if (i !== 10) i -= 10
				await ninteraction.update({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Fuchsia)
							.setTitle(`Songs in the Queue`)
							.setDescription(
								`**CURRENT:** \`${song.durationFormatted}\` - [${song.title}](${client.getYTLink(song.id ? song.id : "")}) - ${
									song.requester
								}`
							)
							.addFields(
								{ name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
								{ name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
								{ name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true }
							)
							.addFields(
								queue.tracks
									.slice(1)
									.slice(i - 10, i)
									.map((track, index) => {
										return {
											name: `Track \`${client.queuePos(index + i - 9)}\` - \`${track.durationFormatted}\``,
											value: `> [${track.title}](${client.getYTLink(track.id ? track.id : "")}) - ${track.requester}`,
											inline: false
										}
									})
							)
					],
					components: [buttons]
				})
			})

			const mnextCollector = msg.createMessageComponentCollector({
				filter: inn => inn.customId == "mnext" && inn.user.id == interaction.user.id,
				time: 120000
			})

			mnextCollector.on("collect", async ninteraction => {
				i = queue.tracks.length
				while (i % 10 !== 0) {
					i++
				}
				await ninteraction.update({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Fuchsia)
							.setTitle(`Songs in the Queue`)
							.setDescription(
								`**CURRENT:** \`${song.durationFormatted}\` - [${song.title}](${client.getYTLink(song.id ? song.id : "")}) - ${
									song.requester
								}`
							)
							.addFields(
								{ name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
								{ name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
								{ name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true }
							)
							.addFields(
								queue.tracks
									.slice(1)
									.slice(i - 10, i)
									.map((track, index) => {
										return {
											name: `Track \`${client.queuePos(index + i - 9)}\` - \`${track.durationFormatted}\``,
											value: `> [${track.title}](${client.getYTLink(track.id ? track.id : "")}) - ${track.requester}`,
											inline: false
										}
									})
							)
					],
					components: [buttons]
				})
			})

			const mprevCollector = msg.createMessageComponentCollector({
				filter: inn => inn.customId == "mprev" && inn.user.id == interaction.user.id,
				time: 120000
			})

			mprevCollector.on("collect", async ninteraction => {
				i = 10
				await ninteraction.update({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Fuchsia)
							.setTitle(`Songs in the Queue`)
							.setDescription(
								`**CURRENT:** \`${song.durationFormatted}\` - [${song.title}](${client.getYTLink(song.id ? song.id : "")}) - ${
									song.requester
								}`
							)
							.addFields(
								{ name: "**Track-loop:**", value: `> ${e2n(queue.trackloop)}`, inline: true },
								{ name: "**Queue-loop:**", value: `> ${e2n(queue.queueloop)}`, inline: true },
								{ name: "**Autoplay:**", value: `> ${e2n(queue.autoplay)}`, inline: true }
							)
							.addFields(
								queue.tracks
									.slice(1)
									.slice(i - 10, i)
									.map((track, index) => {
										return {
											name: `Track \`${client.queuePos(index + i - 9)}\` - \`${track.durationFormatted}\``,
											value: `> [${track.title}](${client.getYTLink(track.id ? track.id : "")}) - ${track.requester}`,
											inline: false
										}
									})
							)
					],
					components: [buttons]
				})
			})
		}
	}
}
