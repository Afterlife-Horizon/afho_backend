import { Collection, Message, MessageType } from "discord.js"
import BotClient from "../botClient/BotClient"
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum, Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai"
import fs from "node:fs"
import { Logger } from "../logger/Logger"

interface IMessageType {
	message?: string
	file?: {
		name: string
		contentType: string
	}
}

let maxLength = 2000

export default async function handleGPTChat(client: BotClient, message: Message) {
	let conversationLog: ChatCompletionRequestMessage[] = []
	if (!client.config.gptChatChannel || !client.config.openAIKey) return
	if (message.channel.id !== client.config.gptChatChannel) return
	if (message.type === MessageType.Reply) return

	Logger.log(`GPT-3 Chat: ${message.author.username} (${message.author.id}) asked: ${message.content}`)

	const configuration = new Configuration({
		apiKey: client.config.openAIKey
	})
	const openai = new OpenAIApi(configuration)

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

	console.log(messages.size, JSON.stringify(messages).length)

	messages.forEach((msg: Message) => {
		if (msg.author.id !== client.user?.id && message.author.bot) return
		if (msg.author.id !== message.author.id) return

		conversationLog.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: msg.content })
	})

	const request: CreateChatCompletionRequest = {
		model: "gpt-3.5-turbo",
		messages: conversationLog
	}

	try {
		const result = await openai.createChatCompletion(request).catch(err => {
			Logger.error(err.message)
			message.reply({ content: "Something went wrong!" })
		})

		if (!result || result.status !== 200) return message.reply({ content: "Something went wrong!" })

		Logger.logGPT(`GPT-3 Chat: ${message.author.username} (${message.author.id}) got: ${result.data.choices[0].message?.content}`)

		const messages = splitTokens(result.data.choices[0].message?.content ? result.data.choices[0].message?.content : "Something went wrong!")

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
		if (err instanceof Error) Logger.error(err.message)
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
		returnMessages.push({ message: codeBlockSelector + codeBlockType + "\n" + codeBlockMessage + codeBlockSelector })
	}

	return returnMessages
}
