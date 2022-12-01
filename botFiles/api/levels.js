const express = require("express");
const router = express.Router();
const path = require('node:path');
const fsPromises = require('fs/promises');

function compareData(count1, count2) {
    if (count1.xp > count2.xp) return -1;
    else if (count1.xp < count2.xp) return 1;
    return 0;
}


module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {
            try {
                const filePath = path.resolve(process.env.WORKPATH, `config/levels.json`);
                const data = await fsPromises.readFile(filePath);

                const moveCounts = await JSON.parse(data);
                const ids = moveCounts.map(m => m.id);

                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
        
                await guild.members.fetch();
                const members = guild.members.cache.filter(m => ids.includes(m.id));

                const sendData = members.map(m => {
                    const count = moveCounts.find(move => move.id === m.id);
                    return { user: m, counter: count.counter };
                });

                res.json(sendData.sort(compareData));
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Internal error"});
            }
        })
    );
}