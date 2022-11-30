const express = require("express");
const router = express.Router();

module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {

            const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");

            await guild.members.fetch();
            const connectedMembers = guild.members.cache.filter(m => typeof m.voice !== undefined);

            res.json(connectedMembers);
        })
    );
}
