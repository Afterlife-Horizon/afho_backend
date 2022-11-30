const express = require("express");
const router = express.Router();
const path = require('node:path');
const fsPromises = require('fs/promises');

module.exports = function (client) {
    return (
        router.post("/", async (req, res) => {
            try {
                const {moverId, movedId} = req.body;

                const logChannel = await client.channels.cache.get(client.config.baseChannelId);
                const brasilChannelId = client.config.brasilChannelId;

                const guild = await client.guilds.cache.find(g => g.name === "Afterlife Horizon");
                const mover = await guild.members.fetch(moverId);
                const member = await guild.members.fetch(movedId);
                const voiceChannel = mover.voice;

                if (!voiceChannel) return res.status(406).json({error: 'You are not in a channel!'});
                if (!member) return res.status(406).json({error: 'Member is not in a channel!'});

                const filePath = path.resolve(process.env.WORKPATH, `config/movecounts.json`);
                const data = await fsPromises.readFile(filePath);
                const moveCounts = JSON.parse(data);
                let moveCount = moveCounts.filter(m => m.id === member.user.id)[0]?.counter;

                if (!moveCount) {
                    fs.writeFile(filePath, JSON.stringify([...moveCounts, { id: member.user.id.toString(), username: member.user.username, counter: 1 }]), 'utf8', (err) => {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }
                        console.log("JSON file has been saved.");
                    });
                }
                else {
                    moveCount += 1;
                    const index = moveCounts.findIndex(m => m.username === member.user.username);
                    moveCounts[index] = { id: member.user.id.toString(), username: member.user.username, counter: moveCount };
                    fs.writeFile(filePath, JSON.stringify([...moveCounts]), 'utf8', (err) => {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }
                    });
                }

                const brasilChannel = client.channels.cache.get(brasilChannelId);
                await member.voice.setChannel(brasilChannel);

                const replyEmbed = new EmbedBuilder()
                    .setColor("Fuchsia")
                    .setTitle(`💨Brasiled`)
                    .addFields(
                        {
                            name: `Mover`,
                            value: `<@${mover.user.id}>`,
                            inline: false,
                        },
                        {
                            name: `Moved`,
                            value: `<@${member.user.id}> to <#${brasilChannelId}> !`,
                            inline: false,
                        },
                        {
                            name: `Move count`,
                            value: `${moveCount ? moveCount : 1}`,
                            inline: false,
                        },
                    );

                await logChannel.send({ embeds: [replyEmbed] });
                res.status(200).send('OK!');

            }
            catch (err) {
                console.error(err);
                await logChannel.send({ content: `❌ An error occured!` });
                res.status(500).json({error: 'Internal error!'});
            }
        })
    );
}


