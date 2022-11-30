const express = require("express");
const router = express.Router();
const {getVoiceConnection} = require("@discordjs/voice");

module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {
            try {
                if (!client.ready) return res.status(406).send("Loading!");
                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
                await guild.members.fetch();
                const admins = await guild.roles.cache.find(r => r.name === "admin").members;
    
                let oldConnection;
                let curPos = 0;
                if (client.currentChannel) oldConnection = getVoiceConnection(client.currentChannel.guild.id);
                if (oldConnection && client.queues.size !== 0 && client.queues.get(client.currentChannel.guild.id).size !== 0) curPos = oldConnection.state.subscription.player.state.resource?.playbackDuration;
                const data = {
                    queue: client.queues,
                    prog: curPos,
                    formatedprog: client.formatDuration(curPos),
                    admins: {
                        admins: admins.map(admin => [admin.user, admin]),
                        usernames: admins.map(admin => admin.user.username),
                    },
                };
                // console.log(client);
                res.send(data);
            }
            catch (err) {
                console.log(err);
                res.end();
            }
        })
    );
}