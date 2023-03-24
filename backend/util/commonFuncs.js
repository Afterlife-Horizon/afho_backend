const fs = require("fs").promises;

module.exports = {
	readJsonFile: async (fileName) => {
		const file = await fs.readFile(fileName, "utf8");
		return JSON.parse(file);
	},

	writeJsonFile: async (fileName, content) => {
		try {
			await fs.writeFile(fileName, content, "utf8");
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	},
};
