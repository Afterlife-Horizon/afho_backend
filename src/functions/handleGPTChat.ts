import { Message } from "discord.js";
import BotClient from "../botClient/BotClient";
import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';

let conversationLog: ChatCompletionRequestMessage[] = [{"role": "user", "content": "Say this is a test!"}];

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
        if (msg.author.id !== client.user?.id && message.author.bot) return;
        if (msg.author.id !== message.author.id) return;
  
        conversationLog.push({"role": "user", "content": msg.content});
      });

      const request: CreateChatCompletionRequest = {
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
      };


      const result = await openai.createChatCompletion(request).catch((err) => {
        console.log(err);
        message.reply({content: "Something went wrong!"});
      });

      if (!result || result.status !== 200) return;

      message.reply({content: result.data.choices[0].message?.content});
}