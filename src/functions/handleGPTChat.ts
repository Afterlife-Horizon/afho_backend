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

      console.log(result?.data);

      if (!result || result.status !== 200) return message.reply({content: "Something went wrong!"});
      
      const messages = splitTokens(result.data.choices[0].message?.content? result.data.choices[0].message?.content : "Something went wrong!")

      console.log(messages);

      for (let i = 0; i < messages.length; i++) {
        await message.reply({content: messages[i]});
      }

}

function splitTokens(message: string) {

  if (message.length <= 2000) return [message];

  let tokens = message.split(" ");
  const codeBlock = "```";
  let charCount = 0;
  const messages: string[] = [];
  // split message into 2000 character chunks without splitting code blocks or words
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].startsWith(codeBlock)) {
      let codeBlockEnd = i;
      for (let j = i; j < tokens.length; j++) {
        if (tokens[j].endsWith(codeBlock)) {
          codeBlockEnd = j;
          break;
        }
      }
      const codeBlockMessage = tokens.slice(i, codeBlockEnd + 1).join(" ");
      if (charCount + codeBlockMessage.length > 2000) {
        messages.push(tokens.slice(0, i).join(" "));
        tokens = tokens.slice(i);
        charCount = 0;
        i = 0;
      } else {
        charCount += codeBlockMessage.length;
        i = codeBlockEnd;
      }
    } else {
      if (charCount + tokens[i].length > 2000) {
        messages.push(tokens.slice(0, i).join(" "));
        tokens = tokens.slice(i);
        charCount = 0;
        i = 0;
      } else {
        charCount += tokens[i].length;
      }
    }
  }
  messages.push(tokens.join(" "));
  return messages;
}