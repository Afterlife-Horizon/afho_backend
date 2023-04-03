import { Message, MessageType } from "discord.js";
import BotClient from "../botClient/BotClient";
import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import fs from 'node:fs';

interface IMessageType {
  message?: string;
  file?: string;
}


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

      for (let i = 0; i < messages.length; i++) {

        if (messages[i].message) {
          await message.reply({content: messages[i].message});
        } else if (messages[i].file) {
          await message.reply({files: [`./messages/${messages[i].file}`]});
          fs.rm("./messages/" + messages[i].file, (err) => console.log(err))
        }
      }
}

function splitTokens(message: string) : IMessageType[] {
  const codeBlock = "```";
  const returnMessages: IMessageType[] = [];

  // if a message is bigger than 4000 characters, create a file containing codeBlocks and add it to returnMessages
  // if it is text only add it to returnMessages
  if (message.length > 4000) {
    const codeBlocks: string[] = [];
    const text: string[] = [];
    const tokens = message.split(" ");
    let charCount = 0;
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
        if (charCount + codeBlockMessage.length > 4000) {
          text.push(tokens.slice(0, i).join(" "));
          tokens.splice(0, i);
          charCount = 0;
          i = 0;
        } else {
          charCount += codeBlockMessage.length;
          codeBlocks.push(codeBlockMessage);
          i = codeBlockEnd;
        }
      } else {
        if (charCount + tokens[i].length > 4000) {
          text.push(tokens.slice(0, i).join(" "));
          tokens.splice(0, i);
          charCount = 0;
          i = 0;
        } else {
          charCount += tokens[i].length;
          text.push(tokens[i]);
        }
      }
    }
    text.push(tokens.join(" "));
    if (codeBlocks.length > 0) {
      const fileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".txt";
      fs.writeFile("./messages/" + fileName, codeBlocks.join(" "), (err) => console.log(err));
      returnMessages.push({file: fileName});
    }
    if (text.length > 0) {
      returnMessages.push({message: text.join(" ")});
    }
  } else {
    returnMessages.push({message: message});
  }

  return returnMessages;
}