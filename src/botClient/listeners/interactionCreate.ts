import BotClient from "../BotClient"

export default function (client: BotClient) {
	return (
		// ------------ Taking care of Slash commands ------------
		client.on("interactionCreate", async interaction => {
			if (!interaction.isChatInputCommand()) return

			const command = client.commands.get(interaction.commandName)

			if (!command) return

			try {
				// console.log(interaction);
				await command.execute(interaction)
			} catch (error) {
				console.error(error)
				await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
			}
		})
	)
}
