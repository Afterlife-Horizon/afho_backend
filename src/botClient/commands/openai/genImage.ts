import { SlashCommandBuilder } from "discord.js"
import { Configuration, CreateImageRequestSizeEnum, OpenAIApi } from "openai"
import { ICommand } from "../../../types"
import BotClient from "../../BotClient"

export default (_: BotClient): ICommand => {
	return {
		data: new SlashCommandBuilder()
			.setName("image")
			.setDescription("generate an image with openai!")
			.addStringOption(option => option.setName("request").setDescription("the image you want to generate").setRequired(true))
			.addStringOption(option => option.setName("size").setDescription('the size of the image "256x256" | "512x512" | "1024x1024"')),
		async execute(interaction) {
			const configuration = new Configuration({
				apiKey: "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"
			})
			const openai = new OpenAIApi(configuration)

			interaction.reply({ content: "Thinking..." })

			const response = await openai.createImage({
				prompt: interaction.options.get("request")?.value as string,
				n: 1,
				size: (interaction.options.get("size")?.value as CreateImageRequestSizeEnum) || "256x256"
			})

			interaction.editReply({ content: response.data.data[0].url })
		}
	}
}
