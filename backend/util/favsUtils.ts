const fs = require("fs").promises;
import path = require("path");
import { readJsonFile } from "./commonFuncs";
require("dotenv").config();

module.exports = (client) => {
	const favsPath = path.join(
		process.env.WORKPATH,
		"./config/TestUserFavs.json"
	);
	return readJsonFile(favsPath)
		.then((favs) => {
			client.favs = favs;
		})
		.catch((err) => {
			console.error(err);
		});
};
