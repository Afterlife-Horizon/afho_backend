import { ClientOptions, GatewayIntentBits, Partials } from "discord.js";
import BotClient from "./botClient/BotClient";
import ExpressClient from "./api/ExpressClient";
import http from "http";
import https from "https";
import fs from "node:fs";

const options = {
	presence: {
		activities: [
			{
				name: `music.afterlifehorizon.net`,
				type: "LISTENING",
			},
			{
				name: "/help",
				url: "https://music.afterlifehorizon.net",
			}
		],
		status: "online",
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
	failIfNotExists: false,
	allowedMentions: {
		parse: ["roles", "users"],
		repliedUser: false,
	},
	shards: "auto",
} as ClientOptions;

const client = new BotClient(options);

client.once("ready", () => {
	console.log("logged in as: " + client.user?.tag);
	client.ready = true;
});


const expressClient = new ExpressClient(client);

const credentials = {
	key: fs.readFileSync(process.env.CERT_KEY || ""), 
	cert: fs.readFileSync(process.env.CERT || "")
};

const httpServer = http.createServer(expressClient.app);
const httpsServer = https.createServer(credentials, expressClient.app);
httpServer.listen(8080, () => {
	console.log("HTTP Server running on port 8080");
	});
httpsServer.listen(8443, () => {
	console.log("HTTPS Server running on port 8443");
	});


// --------- Loging in bot ---------
if (!client.config.token || client.config.token === "") throw new Error("No token provided");
client.login(client.config.token);



