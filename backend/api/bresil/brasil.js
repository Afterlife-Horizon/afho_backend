const express = require("express");
const router = express.Router();
const path = require('node:path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { EmbedBuilder } = require('discord.js');

module.exports = function (client) {
    return (
        router.post("/", async (req, res) => {
            try {
                const {moverId, movedId} = req.body;

                const logChannel = client.channels.cache.get(client.config.baseChannelId);
                const brasilChannelId = client.config.brasilChannelId;

                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
                const mover = await guild.members.fetch(moverId);
                const member = await guild.members.fetch(movedId);
                const voiceChannel = mover.voice;

                if (!voiceChannel) return res.status(406).json({error: 'You are not in a channel!'});
                if (!member) return res.status(406).json({error: 'Member is not in a channel!'});

                const moveCount = 1;
                const moverCount = 1;
    
                selectFromDB("afho", "SELECT * FROM bot_bresil WHERE id = ? ", [movedId], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                    else if(rows.size > 0) {
                        updateDB("afho", "UPDATE bot_bresil SET bresil_received = bresil_received + 1 WHERE id = ?", [movedId], (err) => {
                            if (err) {
                                return console.log(err);
                            }
                        })
                        moveCount = rows[0].bresil_recieved + 1;
                    }
                    else {
                        updateDB("afho", "INSERT INTO bot_bresil (id, username, bresil_received) VALUES (?, ?, 1)", [movedId, member.user.username], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                });
    
                selectFromDB("afho", "SELECT * FROM bot_bresil WHERE id = ?", [moverId], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                    else if (rows.size > 0) {
                        updateDB("afho", "UPDATE bot_bresil SET bresil_sent = bresil_sent + 1 WHERE id = ?", [moverId], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                        moverCount = rows[0].bresil_sent + 1;
                    }
                    else {
                        updateDB("afho", "INSERT INTO bot_bresil (id, username, bresil_sent) VALUES (?, ?, 1)", [moverId, mover.user.username], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                });

                const brasilChannel = client.channels.cache.get(brasilChannelId);
                await member.voice.setChannel(brasilChannel);

                const replyEmbed = new EmbedBuilder()
                    .setColor("Fuchsia")
                    .setTitle(`💨Brasiled`)
                    .addFields(
                        {
                            name: `Mover`,
                            value: `<@${interaction.user.id}>`,
                            inline: false,
                        },
                        {
                            name: `Moved`,
                            value: `<@${member.user.id}> to <#${brasilChannelId}> !`,
                            inline: false,
                        },
                        {
                            name: `${member} moved `,
                            value: `${moveCount} times!`,
                            inline: false,
                        },
                        {
                            name: `${interaction.member} moved people`,
                            value: `${moverCount} times!`,
                            inline: false,
                        }
                    );

                await logChannel.send({ embeds: [replyEmbed] });
                res.status(200).send('OK!');

            }
            catch (err) {
                console.log(err);
                await logChannel.send({ content: `❌ An error occured!` });
                res.status(500).json({error: 'Internal error!'});
            }
        })
    );
}


