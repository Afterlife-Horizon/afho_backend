/* eslint-disable no-useless-escape */
// --------- basic imports ---------
require("colors");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
var http = require('http');
var https = require('https');
const connectHistoryApiFallback = require("connect-history-api-fallback");

// --------- importing discord.js / Init ---------
const { Client, Collection, GatewayIntentBits } = require("discord.js");

const client = new Client({
	presence: {
		activity: {
			name: `/help`,
			type: "PLAYING",
		},
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
	partials: ["message", "channel", "reaction"],
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
			client.commands.set(command.data.name, command);
		});
});

client.queues = new Collection();
require("./util/musicUtils.js")(client);

client.favs = new Collection();
require("./util/favsUtils.js")(client);

// --------- listeners ---------
client.once("ready", () => {
	console.log("logged in as: " + client.user.tag);
	client.ready = true;
});
require("./listeners/messageCreate.js")(client);
require("./listeners/interactionCreate.js")(client);
require("./listeners/voiceStateUpdate.js")(client);

// ------------ api routes ------------

const levels = require("./api/levels.js");

// ------------ bresil ------------
const brasilBoard = require("./api/bresil/brasilboard");
const connectedMembers = require("./api/bresil/connectedMembers");
const bresilMember = require("./api/bresil/brasil");

// ------------ music ------------
const musicSkip = require("./api/music/skip");
const musicPause = require("./api/music/pause");
const musicResume = require("./api/music/unpause");
const musicStop = require("./api/music/stop");
const musicClearQueue = require("./api/music/clearQueue");
const musicShuffle = require("./api/music/shuffle");
const musicSkipto = require("./api/music/skipto");
const musicRemove = require("./api/music/remove");
const musicPlay = require("./api/music/play");
const musicPlayFirst = require("./api/music/playFirst");
const musicDisconnect = require("./api/music/disconnect");
const musicFilters = require("./api/music/filters");
const musicFetch = require("./api/music/fetch");
const musicGetFavs = require("./api/music/getFavs");
const musicAddFav = require("./api/music/addFav");
const musicRemoveFav = require("./api/music/delFav");

// ------------ login ------------
const login = require("./api/login/login");
const loginAccess = require("./api/login/loginAccess");

const app = express();
const port = process.env.PORT || 4000;
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
	.use("/api/disconnect", musicRemove(client))
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
	.use(express.static(path.join(__dirname, "../webapp/frontend/build")))
	.listen(port, () =>
		console.log(`Listening on port ${port}`.toUpperCase().white.bgGreen.bold)
	);

const credentials = {
	key: fs.readFileSync('/home/nico/.ssh/AFHO.key'), 
	cert: fs.readFileSync('/home/nico/.ssh/AFHO.crt')
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
httpServer.listen(80, () => {
	console.log("HTTP Server running on port 80");
	});
httpsServer.listen(443, () => {
	console.log("HTTPS Server running on port 443");
	});



// --------- Loging in bot ---------
client.login(client.config.token);
