import { Message } from "discord.js";
import BotClient from "../botClient/BotClient";
import { Configuration, OpenAIApi } from 'openai';

let conversationLog: string[] = [];

export default async function handleGPTChat(client: BotClient, message: Message) {
    if (!client.config.gptChatChannel || !client.config.openaiKey) return;
    if (message.channel.id !== client.config.gptChatChannel) return;

    const configuration = new Configuration({
        apiKey: client.config.openaiKey,
      });
      const openai = new OpenAIApi(configuration);

      await message.channel.sendTyping();

      let prevMessages = await message.channel.messages.fetch({ limit: 15 });
      prevMessages.reverse();

      prevMessages.forEach((msg: Message) => {
        if (message.content.startsWith('!')) return;
        if (msg.author.id !== client.user?.id && message.author.bot) return;
        if (msg.author.id !== message.author.id) return;
  
        conversationLog.push(msg.content);
      });

      const result = await openai
        .createCompletion({
          model: 'gpt-3.5-turbo',
          prompt: conversationLog,
          // max_tokens: 256, // limit token usage
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
          return message.reply({content: 'Something went wrong with OpenAI, please try again later.'});
        });

      if (!result) return;

      message.reply({content: result.data.choices[0].text});
}