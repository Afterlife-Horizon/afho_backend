import fs = require("fs");

/**
 * 
 * @param fileName name of the file to read
 * @returns the content of the file as a string
 */
export async function readJsonFile(fileName: string) : Promise<any> {
	const file = await fs.promises.readFile(fileName, "utf8");
	return JSON.parse(file);
}

/**
 * 
 * @param fileName name of the file to write
 * @param content content to write to the file
 * @returns true if the file was written successfully, false otherwise
 */
export async function writeJsonFile (fileName: string, content: string) : Promise<boolean> {
	try {
		await fs.promises.writeFile(fileName, content, "utf8");
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}
