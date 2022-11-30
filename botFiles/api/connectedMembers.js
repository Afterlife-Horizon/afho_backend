const express = require("express");
const router = express.Router();

module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {

            await client.guilds.fetch();
            const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
            console.log(guild);

            await guild.members.fetch();
            const connectedMembers = guild.members.cache.filter(m => m.voice.channel);

            res.json(connectedMembers);
        })
    );
}
