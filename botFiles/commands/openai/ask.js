const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask a question to openai!')
        .addStringOption(option => option.setName('question').setDescription('The question you want to ask').setRequired(true)),
    async execute(interaction) {

        const configuration = new Configuration({
            apiKey: interaction.client.config.openaiKey,
          });
          const openai = new OpenAIApi(configuration);
        

        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: interaction.options.getString('question'),
            temperature: 0.6,
          });

          if (completion.data.choices[0].text.length > 2000) {
            return interaction.reply({ content: truncateString(completion.data.choices[0].text, 2000)});
          }

        interaction.reply({ content: completion.data.choices[0].text });
    },
};

function truncateString(str, num) {
    if (str.length <= num) {
      return str
    }

    return str.slice(0, num - 4) + '...'
  }