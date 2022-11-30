const express = require("express");
const router = express.Router();

module.exports = function (client) {
    return (
        router.post("/", async (req, res) => {
            const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
        const connectedMembers = await guild.members.cache.filter(member => member.voice.channel);
        const requester = connectedMembers.filter((member) => member.user.username === req.body.user);
        const voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.filter(m => m.user.username === req.body.user).size !== 0);

        if (requester.size === 0) return res.status(406).send("You are not connected to a voice channel!");
        else if (voiceChannel.id !== client.currentChannel.id) return res.status(406).send("Not the same channel!");

        const channel = await client.channels.fetch(base_channelId);
        if (!client.currentChannel) return res.status(406).send("not connected!");

        const queue = client.queues.get(client.currentChannel.guild.id);

        const oldConnection = getVoiceConnection(client.currentChannel.guild.id);
        if (!oldConnection) {
            res.status(406).send("");
            return channel.send({ content: `👎 **I'm not connected somewhere**!` }).catch(() => null);
        }


        if (!queue) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing playing right now**`).catch(() => null);
        }

        if (!queue.tracks || queue.tracks.length <= 1) {
            res.status(406).send("");
            return channel.send(`👎 **Nothing to remove**`).catch(() => null);
        }
        const arg = req.body.queuePos;

        if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
            res.status(406).send("");
            return channel.send({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${arg}th Song.**` });
        }

        queue.skipped = true;

        queue.tracks.splice(arg, 1);

        res.status(200).send("OK");
        return channel.send(`⏭️ **Successfully removed track number ${arg}**`).catch(() => null);
        })
    );
}