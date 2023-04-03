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
          if (messages[i].message === "" || messages[i].message === " ") continue;
          await message.reply({content: messages[i].message});
        } else if (messages[i].file) {
          await message.reply({files: [`./messages/${messages[i].file}`]});
          fs.rm("./messages/" + messages[i].file, (err) => console.log(err))
        }
      }
}

function splitTokens(message: string): IMessageType[] {
  let returnMessages: IMessageType[] = [];

  const codeBlockSelector = "```";
  
  let codeBlock = false;
  let codeBlockType = "";
  let codeBlockMessage = "";

  let messageCount = 0;
  let messageContent = "";

  let messageArray = message.split(" ");

  for (let i = 0; i < messageArray.length; i++) {
      if (messageArray[i].includes(codeBlockSelector)) {
          if (!codeBlock) {

              if (!messageArray[i].startsWith(codeBlockSelector)) {

                  if (messageContent.length + messageArray[i].length + 1 >= 4000) {
                      returnMessages.push({message: messageContent});
                      messageContent = "";
                      messageCount++;
                  }
                  messageContent += messageArray[i].split(codeBlockSelector)[0] + " ";
                  messageArray[i] = messageArray[i].split(codeBlockSelector)[1];
              }

              returnMessages.push({message: messageContent});
              codeBlockType = messageArray[i].replace(codeBlockSelector, "");
              messageContent = "";
              messageCount++;
          }
          else {
              if (!messageArray[i].startsWith(codeBlockSelector)) {
                  codeBlockMessage += messageArray[i].split(codeBlockSelector)[0] + " ";
                  messageArray[i] = messageArray[i].split(codeBlockSelector)[1];
              }

              returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType);
          }
          codeBlock = !codeBlock;
          continue;
      }

      if (codeBlock) {
          codeBlockMessage += messageArray[i] + " ";
          continue;
      }

      if (messageContent.length + messageArray[i].length + 1 >= 4000) {
          returnMessages.push({message: messageContent});
          messageContent = "";
          messageCount++;
      }
      messageContent += messageArray[i] + " ";
  }

  if (!codeBlock) returnMessages.push({message: messageContent});
  else {
      returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType);
  }
  return returnMessages;
}


function handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType) {
  if (codeBlockMessage.length > 4000) {
      if (!fs.existsSync("./messages")) fs.mkdirSync("./messages")
      returnMessages.push({file: `codeBlock${messageCount}.txt`})

      codeBlockMessage = codeBlockMessage.replace(/```/g, "");

      fs.writeFile(`./messages/codeBlock${messageCount}.txt`, codeBlockMessage, (err) => {
          if (err) console.log(err);
      });
  }
  else {
      returnMessages.push({message: codeBlockSelector + codeBlockType + "\n" + codeBlockMessage + codeBlockSelector});
  }

  return returnMessages;
}
