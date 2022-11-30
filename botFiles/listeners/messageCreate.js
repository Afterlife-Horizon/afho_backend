const fs = require('node:fs');
const path = require('node:path');
const fsPromises = require('fs/promises');
require('dotenv').config();

const exp = 4;
const getLevel = xp => {
    return Math.floor(Math.pow((xp / exp), 1 / exp));
}

module.exports = function (client) {
    return (
        // ------------ Taking care of Slash commands ------------
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (!message.guild) return;
            try {
                const filePath = path.resolve(process.env.WORKPATH, `config/levels.json`);
                const data = await fsPromises.readFile(filePath);
                const levels = JSON.parse(data);
                let xp = levels.filter(m => m.id === message.author.id)[0]?.xp;

                if (!xp) {
                    fs.writeFile(filePath, JSON.stringify([...levels, { id: message.author.id.toString(), username: message.author.username, xp: 1, lvl: getLevel(1) }]), 'utf8', (err) => {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }
                    });
                }
                else {
                    xp += 1;
                    const index = levels.findIndex(m => m.username === message.author.username);
                    levels[index] = { id: message.author.id.toString(), username: message.author.username, xp: xp, lvl: getLevel(xp) };
                    fs.writeFile(filePath, JSON.stringify([...levels]), 'utf8', (err) => {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }
                    });
                }
            }
            catch (error) {
                console.error(error);
            }
        })
    );
}