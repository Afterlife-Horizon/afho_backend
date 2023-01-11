const fs = require("fs").promises;
const path = require("path");
const { readJsonFile } = require("./commonFuncs");
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
