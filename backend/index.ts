/* eslint-disable no-useless-escape */
// --------- basic imports ---------
require("colors");
require("dotenv").config();
import fs = require("node:fs");
import path = require("node:path");
import express = require("express");
import http from 'http';
import https from 'https';
import connectHistoryApiFallback = require("connect-history-api-fallback");

// --------- importing discord.js / Init ---------
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { IClient } from "./types/index.js";

const client: IClient = new Client({
	presence: {
		activities: [
			{
				name: `/help`,
				url: "https://music.afterlifehorizon.net",
			},
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
});

// --------- importing config and commands ---------
client.config =
	process.env.NODE_ENV === "dev"
		? require("./config/devconfig.json")
		: require("./config/config.json");

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).forEach((dir) => {
	const directorypath = path.join(commandsPath, dir);
	fs.readdirSync(directorypath)
		.filter((file) => file.endsWith(".js"))
		.forEach((file) => {
			const filePath = path.join(directorypath, file);
			const command = require(filePath);
			client.commands?.set(command.data.name, command);
		});
});

client.queues = new Collection();
client.favs = new Collection();

require("./util/musicUtils.js")(client);
require("./util/favsUtils.js")(client);

// --------- listeners ---------
client.once("ready", () => {
	console.log("logged in as: " + client.user?.tag);
	client.ready = true;
});
require("./listeners/messageCreate.js")(client);
require("./listeners/interactionCreate.js")(client);
require("./listeners/voiceStateUpdate.js")(client);

// ------------ api routes ------------
import levels = require("./api/levels.js");

// ------------ bresil ------------
import brasilBoard = require("./api/bresil/brasilboard");
import connectedMembers = require("./api/bresil/connectedMembers");
import bresilMember = require("./api/bresil/brasil");

// ------------ music ------------
import musicSkip = require("./api/music/skip");
import musicPause = require("./api/music/pause");
import musicResume = require("./api/music/unpause");
import musicStop = require("./api/music/stop");
import musicClearQueue = require("./api/music/clearQueue");
import musicShuffle = require("./api/music/shuffle");
import musicSkipto = require("./api/music/skipto");
import musicRemove = require("./api/music/remove");
import musicPlay = require("./api/music/play");
import musicPlayFirst = require("./api/music/playFirst");
import musicDisconnect = require("./api/music/disconnect");
import musicFilters = require("./api/music/filters");
import musicFetch = require("./api/music/fetch");
import musicGetFavs = require("./api/music/getFavs");
import musicAddFav = require("./api/music/addFav");
import musicRemoveFav = require("./api/music/delFav");

// ------------ login ------------
import login = require("./api/login/login");
import loginAccess = require("./api/login/loginAccess");

const app = express();
app
	.use(express.json())
	.use("/api/levels", levels(client))
	.use("/api/brasilBoard", brasilBoard(client))
	.use("/api/connectedMembers", connectedMembers(client))
	.use("/api/bresilMember", bresilMember(client))
	.use("/api/skip", musicSkip(client))
	.use("/api/pause", musicPause(client))
	.use("/api/unpause", musicResume(client))
	.use("/api/stop", musicStop(client))
	.use("/api/clearqueue", musicClearQueue(client))
	.use("/api/shuffle", musicShuffle(client))
	.use("/api/skipto", musicSkipto(client))
	.use("/api/remove", musicRemove(client))
	.use("/api/disconnect", musicDisconnect(client))
	.use("/api/play", musicPlay(client))
	.use("/api/playfirst", musicPlayFirst(client))
	.use("/api/filters", musicFilters(client))
	.use("/api/fetch", musicFetch(client))
	.use("/api/getFavs", musicGetFavs(client))
	.use("/api/addFav", musicAddFav(client))
	.use("/api/delFav", musicRemoveFav(client))
	.use("/api/login", login())
	.use("/api/loginaccess", loginAccess())
	.use(connectHistoryApiFallback({ verbose: false }))
	.use(express.static(path.join(__dirname, "../frontend/dist")))

const credentials = {
	key: fs.readFileSync(process.env.CERTKEY || ""), 
	cert: fs.readFileSync(process.env.CERT || "")
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
httpServer.listen(8080, () => {
	console.log("HTTP Server running on port 8080");
	});
httpsServer.listen(8443, () => {
	console.log("HTTPS Server running on port 8443");
	});



// --------- Loging in bot ---------
if (!client.config?.token) throw new Error("No token provided");
client.login(client.config.token);
