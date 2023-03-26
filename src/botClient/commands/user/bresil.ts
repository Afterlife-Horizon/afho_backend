import { SlashCommandBuilder, EmbedBuilder, APIInteractionGuildMember, Guild, GuildMember, GuildVoiceChannelResolvable } from "discord.js";
import { ICommand } from "../../../types";
import BotClient from "../../BotClient";
require("dotenv").config();

export default (client: BotClient) : ICommand => {
    return {
		data: new SlashCommandBuilder()
			.setName("bresil")
			.setDescription("Move member to bresil!")
			.addStringOption((option) =>
				option
					.setName("member")
					.setDescription("member you want to move!")
					.setRequired(true)
			),
		async execute(interaction) {
			try {
				const brasilChannelId = client.config.brasilChannelId;
				const interactionMember = interaction.member as GuildMember;
				const voiceChannel = interactionMember.voice;
				const messageMember = interaction.options.get("member")?.value as string;
				const memberid = messageMember.replace(/\D/g, "");
				if (!voiceChannel)
					return await interaction.reply({
						content: `❌ You are not in a channel you wanker!`,
					});

				const guild = interaction.client.guilds.cache.find((g) => g.name === "Afterlife Horizon");
				const member = await guild?.members.fetch(memberid);
				if (!member) return await interaction.reply({ content: `❌ Member is not in a channel!` });

				let moveCount = 1;
				let moverCount = 1;

				client.dbClient.selectFromDB("SELECT * FROM bot_bresil WHERE id = ? ", [memberid], (err, rows) => {
					if (err) {
						console.log(err);
					}
					else if(rows.length > 0) {
						client.dbClient.updateDB("UPDATE bot_bresil SET bresil_received = bresil_received + 1 WHERE id = ?", [memberid], (err) => {
							if (err) {
								return console.log(err);
							}
						})
						moveCount = rows[0].bresil_received + 1;
					}
					else {
						client.dbClient.updateDB("INSERT INTO bot_bresil (id, username, bresil_received) VALUES (?, ?, 1)", [memberid, member.user.username], (err) => {
							if (err) {
								console.log(err);
							}
						})
					}
				});

				client.dbClient.selectFromDB("SELECT * FROM bot_bresil WHERE id = ?", [interactionMember.id], (err, rows) => {
					if (err) {
						console.log(err);
					}
					else if (rows.length > 0) {
						client.dbClient.updateDB("UPDATE bot_bresil SET bresil_sent = bresil_sent + 1 WHERE id = ?", [interactionMember.id], (err) => {
							if (err) {
								console.log(err);
							}
						})
						moverCount = rows[0].bresil_sent + 1;
					}
					else {
						client.dbClient.updateDB("INSERT INTO bot_bresil (id, username, bresil_sent) VALUES (?, ?, 1)", [interactionMember.id, interactionMember.user.username], (err) => {
							if (err) {
								console.log(err);
							}
						})
					}
				})

				const brasilChannel = client.channels.cache.get(brasilChannelId) as GuildVoiceChannelResolvable;
				if (!brasilChannel) return await interaction.reply({ content: `❌ Bresil Channel not found!` });
				await member.voice.setChannel(brasilChannel);

				const replyEmbed = new EmbedBuilder()
					.setColor("Fuchsia")
					.setTitle(`💨Brasiled`)
					.addFields(
						{
							name: `Mover: `,
							value: `<@${interaction.user.id}>`,
							inline: false,
						},
						{
							name: `Moved: `,
							value: `<@${member.user.id}> to <#${brasilChannelId}> !`,
							inline: false,
						},
						{
							name: `count:`,
							value: `${moveCount} times!`,
							inline: false,
						},
						{
							name: `moved people: `,
							value: `${moverCount} times!`,
							inline: false,
						}
					);

				await interaction.reply({ embeds: [replyEmbed] });
			} catch (err) {
				console.error(err);
				await interaction.reply({ content: `❌ An error occured!` });
			}
		},
	}
};
