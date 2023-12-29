import { SlashCommandBuilder } from "discord.js"
import type { ICommand } from "../../../types"
import type BotClient from "../../../botClient/BotClient"
import { Logger } from "../../../logger/Logger"
require("dotenv").config()

/**
 *
 * @param input string representation of a date in format DD/MM/YYYY
 * @returns [day, month, year] as numbers
 */
function validateAndParseinput(input: string) {
	const matched = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
	if (!matched) return new Error("Incorrect format")
	const date = input.split("/").map(e => Number(e))
	if (date[0] < 1 || date[0] > 31 || date[1] < 1 || date[1] > 12 || date[2] < 1950 || date[2] > new Date().getTime())
		return new Error("Invalid Date")
	return date
}

export default (client: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("addbirthday")
			.setDescription("Add your birthday to the bot! The bot will then announce your bitrthday on its day!")
			.addStringOption(option => option.setName("date").setRequired(true).setDescription("DD/MM/YYYY"))
			.addBooleanOption(option =>
				option.setName("announce").setDescription("Set to false if you don't want your birthday to be announced! (defaults to true)")
			)
			.addBooleanOption(option =>
				option.setName("display_age").setDescription("set wether you want your age to be displayed (defaults to false)")
			),
		async execute(interaction) {
			const date = validateAndParseinput(interaction.options.get("date", true).value?.toString() || "")
			if (date instanceof Error) return interaction.reply(date.message)
			const [day, month, year] = date
			const birthdate = new Date()
			birthdate.setFullYear(year, month - 1, day)
			birthdate.setMilliseconds(1)
			birthdate.setSeconds(0)
			birthdate.setMinutes(0)
			birthdate.setHours(2)

			const announce = Boolean(interaction.options.get("announce", false)?.value)
			const displayAge = Boolean(interaction.options.get("display_age", false)?.value)

			try {
				await client.prisma.birthDate.upsert({
					where: {
						user_id: interaction.user.id
					},
					create: {
						user_id: interaction.user.id,
						birthdate,
						annouceBirthday: announce,
						displayAge
					},
					update: {
						birthdate,
						annouceBirthday: announce,
						displayAge
					}
				})
			} catch (err) {
				Logger.error(err)
				return interaction.reply("Internal Error!")
			}

			interaction.reply("Date added!")
		}
	}
}
