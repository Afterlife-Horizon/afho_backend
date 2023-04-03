import { Message, MessageType } from "discord.js";
import BotClient from "../botClient/BotClient";
import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';

let conversationLog: ChatCompletionRequestMessage[] = [];

export default async function handleGPTChat(client: BotClient, message: Message) {
    if (!client.config.gptChatChannel || !client.config.openaiKey) return;
    if (message.channel.id !== client.config.gptChatChannel) return;

    if (message.type === MessageType.Reply) return;

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

      if (!result || result.status !== 200) return message.reply({content: "Something went wrong!"});
      
      const messages = splitTokens(result.data.choices[0].message?.content? result.data.choices[0].message?.content : "Something went wrong!")

      console.log(messages);

      for (let i = 0; i < messages.length; i++) {
        await message.channel.send({content: messages[i]});
      }
      
      message.reply({content: result.data.choices[0].message?.content});
}

function splitTokens(message: string) {

  if (message.length <= 2000) return [message];

  let tokens = message.split(" ");
  const codeBlock = "```";
  let charCount = 0;
  const messages: string[] = [];
  // split message into 2000 character chunks without splitting code blocks 
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes(codeBlock)) {
      charCount += tokens[i].length + 1;
      if (charCount > 0) {
        messages.push(message.substring(0, charCount));
        message = message.substring(charCount);
        charCount = 0;
      }
      const codeBlockEnd = message.indexOf(codeBlock, message.indexOf(codeBlock) + 1);
      messages.push(message.substring(0, codeBlockEnd + 3));
      message = message.substring(codeBlockEnd + 3);
      i = 0;
      continue;
    }
    else if (charCount + tokens[i].length + 1 > 2000) {
      messages.push(message.substring(0, charCount));
      message = message.substring(charCount);
      charCount = 0;
      i = 0;
      continue;
    }
    else {
      charCount += tokens[i].length + 1;
    }

    if (i === tokens.length - 1) {
      messages.push(message);
    }
  }

  return messages;
}