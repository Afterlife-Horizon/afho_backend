import { Collection, Message, MessageType } from "discord.js"
import fs from "node:fs"
import { OpenAI } from "openai"
import BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

const chatCompletion = openai.completions

interface IMessageType {
    message?: string
    file?: {
        name: string
        contentType: string
    }
}

let maxLength = 2000

export default async function handleGPTChat(client: BotClient, message: Message) {
    let conversationLog: any[] = []
    if (!client.config.gptChatChannelID || !client.config.openAIKey) return
    if (message.channel.id !== client.config.gptChatChannelID) return
    if (message.type === MessageType.Reply) return

    Logger.log(`GPT-3 Chat: ${message.author.username} (${message.author.id}) asked: ${message.content}`)

    openai.apiKey = client.config.openAIKey

    await message.channel.sendTyping()

    let prevMessages = (await message.channel.messages.fetch()).reverse()
    let count = 0
    const messages = new Collection<string, Message>()
    for (const message of prevMessages.entries()) {
        if (message[1].author.bot) continue
        count += message[1].content.length
        if (count > 1800) break
        messages.set(message[0], message[1])
    }

    messages.forEach((msg: Message) => {
        if (msg.author.id !== client.user?.id && message.author.bot) return
        if (msg.author.id !== message.author.id) return

        conversationLog.push({
            role: "User",
            content: msg.content
        })
    })

    const request: OpenAI.Completions.CompletionCreateParamsNonStreaming = {
        model: "gpt-3.5-turbo",
        prompt: conversationLog
    }

    try {
        const result = await chatCompletion.create(request).catch(err => {
            Logger.error(err.message)
            message.reply({ content: "Something went wrong!" })
        })

        if (!result) return message.reply({ content: "Something went wrong!" })

        Logger.logGPT(`GPT-3 Chat: ${message.author.username} (${message.author.id}) got: ${result.choices[0].text}`)

        const messages = splitTokens(result.choices[0].text ? result.choices[0].text : "Something went wrong!")

        for (let i = 0; i < messages.length; i++) {
            if (messages[i].message) {
                if (messages[i].message === "" || messages[i].message === " ") continue
                await message.reply({ content: messages[i].message })
            } else if (messages[i].file) {
                const file = fs.readFileSync("./messages/" + messages[i].file?.name)
                await message.reply({
                    files: [
                        {
                            name: messages[i].file?.name,
                            attachment: file,
                            contentType: messages[i].file?.contentType
                        }
                    ]
                })
                fs.rm("./messages/" + messages[i].file?.name, err => {
                    if (err) Logger.error(err.message)
                })
            }
        }
    } catch (err) {
        Logger.error(err)
        message.reply({ content: "Something went wrong!" })
    }
}

function splitTokens(message: string): IMessageType[] {
    let returnMessages: IMessageType[] = []

    const codeBlockSelector = "```"

    let codeBlock = false
    let codeBlockType = ""
    let codeBlockMessage = ""

    let messageCount = 0
    let messageContent = ""

    let messageArray = message.split(" ")

    for (let i = 0; i < messageArray.length; i++) {
        if (messageArray[i].includes(codeBlockSelector)) {
            if (!codeBlock) {
                if (!messageArray[i].startsWith(codeBlockSelector)) {
                    if (messageContent.length + messageArray[i].length + 1 >= maxLength) {
                        returnMessages.push({ message: messageContent })
                        messageContent = ""
                        messageCount++
                    }
                    const split = messageArray[i].split(codeBlockSelector)
                    messageContent += split[0] + " "
                    messageArray[i] = split[1] + " "
                }

                returnMessages.push({ message: messageContent })
                codeBlockType = messageArray[i].replace(codeBlockSelector, "").split("\n")[0]
                codeBlockMessage = messageArray[i].replace(codeBlockSelector, "").split("\n")[1]
                messageContent = ""
                messageCount++
            } else {
                if (!messageArray[i].startsWith(codeBlockSelector)) {
                    codeBlockMessage += messageArray[i].split(codeBlockSelector)[0] + " "
                    messageArray[i] = messageArray[i].split(codeBlockSelector)[1]
                }

                returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType)
            }
            codeBlock = !codeBlock
            continue
        }

        if (codeBlock) {
            codeBlockMessage += messageArray[i] + " "
            continue
        }

        if (messageContent.length + messageArray[i].length + 1 >= maxLength) {
            returnMessages.push({ message: messageContent })
            messageContent = ""
            messageCount++
        }
        messageContent += messageArray[i] + " "
    }

    if (!codeBlock) returnMessages.push({ message: messageContent })
    else {
        returnMessages = handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType)
    }
    return returnMessages
}

function handleCodeBlock(codeBlockMessage, returnMessages, codeBlockSelector, messageCount, codeBlockType) {
    if (codeBlockMessage.length > maxLength) {
        if (!fs.existsSync("./messages")) fs.mkdirSync("./messages")
        returnMessages.push({
            file: {
                name: `codeBlock${messageCount}.${codeBlockType ? codeBlockType : "txt"}`,
                contentType: "text/plain"
            }
        })

        codeBlockMessage = codeBlockMessage.replace(/```/g, "")

        fs.writeFile(`./messages/codeBlock${messageCount}.${codeBlockType ? codeBlockType : "txt"}`, codeBlockMessage, err => {
            if (err) Logger.error(err.message)
        })
    } else {
        returnMessages.push({
            message: codeBlockSelector + codeBlockType + "\n" + codeBlockMessage + codeBlockSelector
        })
    }

    return returnMessages
}
