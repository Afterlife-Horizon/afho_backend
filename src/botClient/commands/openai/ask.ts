import { SlashCommandBuilder } from "discord.js"
import { Configuration, OpenAIApi } from "openai"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"

export default (_: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("ask")
			.setDescription("Ask a question to openai!")
			.addStringOption(option => option.setName("question").setDescription("The question you want to ask").setRequired(true)),
		async execute(interaction) {
			const configuration = new Configuration({
				apiKey: "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"
			})
			const openai = new OpenAIApi(configuration)

			interaction.reply({ content: "Thinking..." })
			const completion = await openai.createCompletion({
				model: "gpt-3.5-turbo",
				prompt: interaction.options.get("question")?.value as string,
				temperature: 0.6,
				max_tokens: 4096
			})

			const response = completion.data.choices[0].text

			if (!response) return interaction.editReply({ content: "No response found." })

			if (response.length > 2000) {
				return interaction.editReply({ content: truncateString(response, 1993) + "..." })
			}

			interaction.editReply({ content: response })
		}
	}
}

function truncateString(str, num) {
	if (str.length <= num) {
		return str
	}

	return str.slice(0, num - 4) + "..."
}
