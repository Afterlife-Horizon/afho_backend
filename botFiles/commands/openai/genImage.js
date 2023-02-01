const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('generate an image with openai!')
        .addStringOption(option => option.setName('request').setDescription('the image you want to generate').setRequired(true))
        .addStringOption(option => option.setName('size').setDescription('the size of the image (1024x1024 | 512x512 | 256x256)')),
    async execute(interaction) {

        const configuration = new Configuration({
            apiKey: "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",
        });
        const openai = new OpenAIApi(configuration);
    
        interaction.reply({ content: 'Thinking...' });

        const response = await openai.createImage({
            prompt: interaction.options.getString('request'),
            n: 1,
            size: interaction.options.getString('size') || '1024x1024',
          });

          interaction.editReply({ content: response.data.data[0].url });
    },
};