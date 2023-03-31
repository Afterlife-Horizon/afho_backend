import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"
dayjs.extend(customParseFormat)
require("dotenv").config()

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("addbirthday")
			.setDescription("Add your birthday to the database!")
			.addStringOption(option => option.setName("birthday").setDescription("input your birthday as dd/mm/year").setRequired(true)),
		async execute(interaction: CommandInteraction) {
			const username = interaction.user.tag
			const serverId = interaction.guild?.id

			const date = dayjs(interaction.options.get("birthday")?.value as string, "DD/MM/YYYY")
			if (date.isValid() === false) {
				await interaction.reply({ content: "Date format isn't valid!", ephemeral: true })
			} else {
				const query = "SELECT * FROM birthdays WHERE username = ? AND serverId = ?"
				const args = [username, serverId ? serverId : ""]
				client.dbClient.selectFromDB(query, args, (err, rows) => {
					if (err) {
						interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
					} else if (rows.length > 0) {
						const query2 = "UPDATE birthdays SET birthdate = ? WHERE username = ? AND serverId = ?"
						const args2 = [date.format("YYYY-MM-DD"), username, serverId]
						client.dbClient.updateDB(query2, args2, err => {
							if (err) {
								console.log(err)
								interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
							} else {
								interaction.reply("Updated your birthdate!")
							}
						})
					} else {
						const query2 = "INSERT INTO birthdays(username, birthdate, serverId) VALUES (?, ?, ?)"
						const args2 = [username, date.format("YYYY-MM-DD"), serverId]
						client.dbClient.updateDB(query2, args2, err => {
							if (err) {
								console.log(err)
								interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
							} else {
								interaction.reply("Added your birthdate!")
							}
						})
					}
				})
			}
		}
	}
}
