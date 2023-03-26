import express = require("express");
const router = express.Router();

module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {
            try {
                await client.guilds.fetch();
                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
    
                await guild.members.fetch();
                const connectedMembers = guild.members.cache.filter(m => m.voice.channel).map(m => m.user);
    
                res.json({data: connectedMembers});
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Internal error"});
            }
            
        })
    );
}
