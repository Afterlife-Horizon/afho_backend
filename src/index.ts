import { ClientOptions, GatewayIntentBits, Partials, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js"
import BotClient from "./botClient/BotClient"
import ExpressClient from "./api/ExpressClient"
import http from "http"
import https from "https"
import fs from "node:fs"
import { exit } from "process"
import { IEnv } from "./types"
import { Logger } from "./logger/Logger"
import reactionCollector from "./botClient/collectors/reactionCollector"
import parseWebsiteURL from "./functions/parseWebsiteURL"

// Check for .env file
if (!fs.existsSync(".env")) throw new Error("No .env file found, creating one...")

Logger.init()

if (!process.env.LOG_LEVEL) Logger.warn("No log level found, using 'info' instead...")

if (process.env.METHOD && process.env.METHOD !== "add" && process.env.METHOD !== "delete") {
	Logger.error("Invalid method provided, please use 'add' or 'delete'")
	throw new Error("Invalid method provided, please use 'add' or 'delete'")
} else if (process.env.METHOD) {
	Logger.log("Running in " + process.env.METHOD + " mode")
	if (!process.env.CLIENT_ID) {
		Logger.error("No clientID found")
		throw new Error("No clientID found")
	}
	if (!process.env.TOKEN) {
		Logger.error("No token found")
		throw new Error("No token found")
	}
} else {
	if (!process.env.DATABASE_URL) {
		Logger.error("No database URL found")
		throw new Error("No database URL found")
	}
	if (!process.env.TOKEN || !process.env.CLIENT_ID) {
		Logger.error("No discord token or clientID found")
		throw new Error("No discord token or clientID found")
	}
	if (!process.env.BRASIL_CHANNEL_ID || !process.env.BASE_CHANNEL_ID) {
		Logger.error("No channel IDs found")
		throw new Error("No channel IDs found")
	}
	if (!process.env.SERVER_ID) {
		Logger.error("No server ID found")
		throw new Error("No server ID found")
	}
	if (!process.env.ADMIN_ROLE_ID) {
		Logger.error("No admin role ID found")
		throw new Error("No admin role ID found")
	}
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
		Logger.error("No Supabase credentials found")
		throw new Error("No Supabase credentials found")
	}
	if (!process.env.WEBSITE_URL) {
		Logger.error("No website URL found")
		throw new Error("No website URL found")
	}
	if (!process.env.CERT || !process.env.CERT_KEY) Logger.warn("No HTTPS certificate found, using HTTP instead...")
	if (!process.env.OPENAI_KEY || !process.env.CHAT_GPT_CHANNEL_ID) Logger.warn("No OpenAI key found, not using OpenAI API")
	if (!process.env.REACTION_ROLE_CHANNEL_ID) Logger.warn("No roles channel ID found, not using reaction roles")
	if (!process.env.YOUTUBE_LOGIN_COOKIE) Logger.warn("No YouTube cookie found, not using YouTube API")
}

const environement = {
	token: process.env.TOKEN,
	clientID: process.env.CLIENT_ID,
	brasilChannelID: process.env.BRASIL_CHANNEL_ID,
	baseChannelID: process.env.BASE_CHANNEL_ID,
	serverID: process.env.SERVER_ID,
	adminRoleID: process.env.ADMIN_ROLE_ID,
	websiteURL: parseWebsiteURL(process.env.WEBSITE_URL),
	supabaseURL: process.env.SUPABASE_URL,
	supabaseKey: process.env.SUPABASE_KEY,
	cert: process.env.CERT,
	certKey: process.env.CERT_KEY,
	openAIKey: process.env.OPENAI_KEY,
	youtubeCookie: process.env.YOUTUBE_LOGIN_COOKIE,
	gptChatChannel: process.env.CHAT_GPT_CHANNEL_ID,
	reactionRoleChannel: process.env.REACTION_ROLE_CHANNEL_ID
} as IEnv

const options = {
	presence: {
		status: "dnd"
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
		Partials.GuildMember,
		Partials.User,
		Partials.GuildScheduledEvent,
		Partials.ThreadMember
	],
	failIfNotExists: false,
	allowedMentions: {
		parse: ["roles", "users"],
		repliedUser: false
	},
	shards: "auto"
} as ClientOptions

const client = new BotClient(options, environement)

client.once("ready", () => {
	client.ready = true
	reactionCollector(client)
	Logger.log("Logged in as " + client.user?.tag)
})

if (process.env.METHOD) {
	const rest = new REST({ version: "10" }).setToken(client.config.token)
	if (process.env.METHOD === "add") {
		Logger.log("Registering application commands...")
		const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
		for (const [name, command] of client.commands) {
			Logger.log("Registering command: " + name)
			commands.push(command.data.toJSON())
		}
		rest.put(Routes.applicationCommands(client.config.clientID), { body: commands })
			.then((data: any) => Logger.log(`Successfully registered ${data.length} application commands.`))
			.then(() => exit(0))
			.catch(console.error)
	}

	if (process.env.METHOD === "delete") {
		Logger.log("Deleting all application commands...")
		rest.put(Routes.applicationCommands(client.config.clientID), { body: [] })
			.then(() => Logger.log("Successfully deleted all application commands."))
			.then(() => exit(0))
			.catch(console.error)
	}
}

if (!process.env.METHOD) {
	const expressClient = new ExpressClient(client)

	const httpServer = http.createServer(expressClient.app)
	httpServer.listen(8080, () => {
		Logger.log("HTTP Server running on port 8080")
	})

	if (environement.cert && environement.certKey) {
		const credentials = {
			key: fs.readFileSync(environement.certKey),
			cert: fs.readFileSync(environement.cert)
		}
		const httpsServer = https.createServer(credentials, expressClient.app)
		httpsServer.listen(8443, () => {
			Logger.log("HTTPS Server running on port 8443")
		})
	}

	// --------- Loging in bot ---------
	client.login(client.config.token).catch(err => {
		Logger.error(err)
		exit(1)
	})
}
