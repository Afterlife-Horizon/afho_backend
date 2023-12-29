import { Events } from "discord.js"
import { Logger } from "../../logger/Logger"
import BotClient from "../BotClient"

export default function (client: BotClient) {
	return client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return

		const command = client.commands.get(interaction.commandName)
		if (!command) {
			await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
			return
		}

		try {
			Logger.log(`Command ${interaction.commandName} was executed by ${interaction.user.tag} (${interaction.user.id})`)
			await command.execute(interaction)
		} catch (error) {
			if (error instanceof Error) Logger.error(error.message)
			await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
		}
	})
}
