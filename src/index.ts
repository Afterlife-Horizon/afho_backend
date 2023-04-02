import { ActivityType, ClientOptions, GatewayIntentBits, Partials, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js"
import BotClient from "./botClient/BotClient"
import ExpressClient from "./api/ExpressClient"
import http from "http"
import https from "https"
import fs from "node:fs"
import { exit } from "process"

// Check for .env file
if (!fs.existsSync(".env")) throw new Error("No .env file found, creating one...")

if (process.env.METHOD && process.env.METHOD !== "add" && process.env.METHOD !== "delete") {
	throw new Error("Invalid method provided, please use 'add' or 'delete'")
} else if (process.env.METHOD) {
	console.log("Running in " + process.env.METHOD + " mode")
	if (!process.env.CLIENT_ID) throw new Error("No clientID found")
	if (!process.env.TOKEN) throw new Error("No token found")
} else {
	if (!process.env.DATABASE_URL) throw new Error("No database url found")
	if (!process.env.TOKEN || !process.env.CLIENT_ID) throw new Error("No discord token or clientID found")
	if (!process.env.BRASIL_CHANNEL_ID || !process.env.BASE_CHANNEL_ID) throw new Error("No channel IDs found")
	if (!process.env.SERVER_ID) throw new Error("No server ID found")
	if (!process.env.ADMIN_ROLE_ID) throw new Error("No admin role ID found")
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) throw new Error("No Supabase credentials found")
	if (!process.env.CERT || !process.env.CERT_KEY) console.log("No HTTPS certificate found, using HTTP instead...")
	if (!process.env.OPENAI_KEY) console.log("No OpenAI key found, not using OpenAI API")
}

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
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
	failIfNotExists: false,
	allowedMentions: {
		parse: ["roles", "users"],
		repliedUser: false
	},
	shards: "auto"
} as ClientOptions

const client = new BotClient(options)

client.once("ready", () => {
	console.log("logged in as: " + client.user?.tag)
	client.ready = true
})

if (process.env.METHOD) {
	const rest = new REST({ version: "10" }).setToken(client.config.token)
	if (process.env.METHOD === "add") {
		console.log("Registering application commands...: ")
		const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
		for (const [name, command] of client.commands) {
			console.log("Registering command: " + name)
			commands.push(command.data.toJSON())
		}
		rest.put(Routes.applicationCommands(client.config.clientID), { body: commands })
			.then((data: any) => console.log(`Successfully registered ${data.length} application commands.`))
			.then(() => {
				exit(0)
			})
			.catch(console.error)
	}

	if (process.env.METHOD === "delete") {
		console.log("Deleting all application commands...")
		rest.put(Routes.applicationCommands(client.config.clientID), { body: [] })
			.then(() => console.log("Successfully deleted all application commands."))
			.then(() => {
				exit(0)
			})
			.catch(console.error)
	}
}

if (!process.env.METHOD) {
	const expressClient = new ExpressClient(client)

	const httpServer = http.createServer(expressClient.app)
	httpServer.listen(8080, () => {
		console.log("HTTP Server running on port 8080")
	})

	if (process.env.CERT && process.env.CERT_KEY) {
		const credentials = {
			key: fs.readFileSync(process.env.CERT_KEY),
			cert: fs.readFileSync(process.env.CERT)
		}
		const httpsServer = https.createServer(credentials, expressClient.app)
		httpsServer.listen(8443, () => {
			console.log("HTTPS Server running on port 8443")
		})
	}

	// --------- Loging in bot ---------
	if (!client.config.token || client.config.token === "") throw new Error("No token provided")
	client.login(client.config.token).catch(err => {
		console.error(err)
		exit(1)
	})
}
