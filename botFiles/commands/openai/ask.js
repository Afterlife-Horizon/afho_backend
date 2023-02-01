const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask a question to openai!')
        .addStringOption(option => option.setName('question').setDescription('The question you want to ask').setRequired(true)),
    async execute(interaction) {

        const configuration = new Configuration({
            apiKey: "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",
          });
          const openai = new OpenAIApi(configuration);
        

        interaction.reply({ content: 'Thinking...' });
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: interaction.options.getString('question'),
            temperature: 0.6,
            max_tokens: 4000,
          });

          if (completion.data.choices[0].text.length > 2000) {
            return interaction.editReply({ content: truncateString(completion.data.choices[0].text, 2000)});
          }

          interaction.editReply({ content: completion.data.choices[0].text });
    },
};

function truncateString(str, num) {
    if (str.length <= num) {
      return str
    }

    return str.slice(0, num - 4) + '...'
  }