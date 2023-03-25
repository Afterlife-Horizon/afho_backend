const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");
const { selectFromDB, updateDB } = require("../../DB/DB_functions");
require("dotenv").config();

module.exports = {
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
			const brasilChannelId = "949759752852877352";
			const voiceChannel = interaction.member.voice;
			const messageMember = interaction.options.getString("member");
			const memberid = messageMember.replace(/\D/g, "");
			if (!voiceChannel)
				return await interaction.reply({
					content: `❌ You are not in a channel you wanker!`,
				});

			const guild = interaction.client.guilds.cache.find((g) => g.name === "Afterlife Horizon");
			const member = await guild.members.fetch(memberid);
			if (!member)
				await interaction.reply({ content: `❌ Member is not in a channel!` });

			const moveCount = 1;
			const moverCount = 1;

			selectFromDB("afho", "SELECT * FROM bot_bresil WHERE id = ? ", [memberid], (err, rows) => {
				if (err) {
					console.log(err);
				}
				else if(rows.size > 0) {
					updateDB("afho", "UPDATE bot_bresil SET bresil_received = bresil_received + 1 WHERE id = ?", [memberid], (err) => {
						if (err) {
							return console.log(err);
						}
					})
					moveCount = rows[0].bresil_received + 1;
				}
				else {
					updateDB("afho", "INSERT INTO bot_bresil (id, username, bresil_received) VALUES (?, ?, 1)", [memberid, member.user.username], (err) => {
						if (err) {
							console.log(err);
						}
					})
				}
			});

			selectFromDB("afho", "SELECT * FROM bot_bresil WHERE id = ?", [interaction.member.id], (err, rows) => {
				if (err) {
					console.log(err);
				}
				else if (rows.size > 0) {
					updateDB("afho", "UPDATE bot_bresil SET bresil_sent = bresil_sent + 1 WHERE id = ?", [interaction.member.id], (err) => {
						if (err) {
							console.log(err);
						}
					})
					moverCount = rows[0].bresil_sent + 1;
				}
				else {
					updateDB("afho", "INSERT INTO bot_bresil (id, username, bresil_sent) VALUES (?, ?, 1)", [interaction.member.id, interaction.member.user.username], (err) => {
						if (err) {
							console.log(err);
						}
					})
				}
			})

			const brasilChannel =
				interaction.client.channels.cache.get(brasilChannelId);
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
};
