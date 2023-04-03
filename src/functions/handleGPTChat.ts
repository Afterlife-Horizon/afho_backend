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

  if (message.length <= 2000) return [{message: message}];

  const codeBlock = "```";
  // let charCount = 0;
  // const messages: string[] = [];
  // // split message into 2000 character chunks without splitting code blocks or words
  // for (let i = 0; i < tokens.length; i++) {
  //   if (tokens[i].startsWith(codeBlock)) {
  //     let codeBlockEnd = i;
  //     for (let j = i; j < tokens.length; j++) {
  //       if (tokens[j].endsWith(codeBlock)) {
  //         codeBlockEnd = j;
  //         break;
  //       }
  //     }
  //     const codeBlockMessage = tokens.slice(i, codeBlockEnd + 1).join(" ");
  //     if (charCount + codeBlockMessage.length > 2000) {
  //       messages.push(tokens.slice(0, i).join(" "));
  //       tokens = tokens.slice(i);
  //       charCount = 0;
  //       i = 0;
  //     } else {
  //       charCount += codeBlockMessage.length;
  //       i = codeBlockEnd;
  //     }
  //   } else {
  //     if (charCount + tokens[i].length > 2000) {
  //       messages.push(tokens.slice(0, i).join(" "));
  //       tokens = tokens.slice(i);
  //       charCount = 0;
  //       i = 0;
  //     } else {
  //       charCount += tokens[i].length;
  //     }
  //   }
  // }
  // messages.push(tokens.join(" "));

  // if a message is bigger than 2000 characters, create a file
  const returnMessages: IMessageType[] = [];

  // if a message is bigger than 2000 characters, create a file containing codeBlocks and add it to returnMessages
  // if it is text only add it to returnMessages

  const codeBlocks: string[] = [];
  const text: string[] = [];
  const tokens = message.split(" ");
  for (let j = 0; j < tokens.length; j++) {
    if (tokens[j].startsWith(codeBlock)) {

      let codeBlockEnd = j;
      for (let k = j; k < tokens.length; k++) {
        if (tokens[k].endsWith(codeBlock)) {
          codeBlockEnd = k;
          break;
        }
      }
      const codeBlockMessage = tokens.slice(j, codeBlockEnd + 1).join(" ");
      codeBlocks.push(codeBlockMessage);
      j = codeBlockEnd;
    } else {
      text.push(tokens[j]);
    }
  }
  if (text.length > 0) {
    returnMessages.push({message: text.join(" ")});
  }
  if (codeBlocks.length > 0) {
    for (let i = 0; i < codeBlocks.length; i++) {
      fs.writeFile(`./messages/codeBlock${i}.txt`, codeBlocks[i], (err) => console.log(err))
      returnMessages.push({file: `codeBlock${i}.txt`});
    }
  }

  return returnMessages;
}