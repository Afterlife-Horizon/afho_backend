import express from "express"
const router = express.Router();
import { EmbedBuilder, TextChannel, VoiceChannel } from 'discord.js';
import BotClient from "../../../botClient/BotClient";

export default function (client: BotClient) {
    return (
        router.post("/", async (req, res) => {
            try {
                const {moverId, movedId} = req.body;

                const logChannel = client.channels.cache.get(client.config.baseChannelId) as TextChannel;
                const brasilChannelId = client.config.brasilChannelId;

                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");

                if (!guild) return res.status(406).json({error: 'Guild not found!'});
                const mover = await guild.members.fetch(moverId);
                const member = await guild.members.fetch(movedId);
                const voiceChannel = mover.voice;

                if (!voiceChannel) return res.status(406).json({error: 'You are not in a channel!'});
                if (!member) return res.status(406).json({error: 'Member is not in a channel!'});

                let moveCount = 1;
                let moverCount = 1;
    
                client.dbClient.selectFromDB("SELECT * FROM bot_bresil WHERE id = ? ", [movedId], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                    else if(rows.length > 0) {
                        client.dbClient.updateDB("UPDATE bot_bresil SET bresil_received = bresil_received + 1 WHERE id = ?", [movedId], (err) => {
                            if (err) {
                                return console.log(err);
                            }
                        })
                        moveCount = rows[0].bresil_received + 1;
                    }
                    else {
                        client.dbClient.updateDB("INSERT INTO bot_bresil (id, username, bresil_received) VALUES (?, ?, 1)", [movedId, member.user.username], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                });
    
                client.dbClient.selectFromDB("SELECT * FROM bot_bresil WHERE id = ?", [moverId], (err, rows) => {
                    if (err) {
                        console.log(err);
                    }
                    else if (rows.length > 0) {
                        client.dbClient.updateDB("UPDATE bot_bresil SET bresil_sent = bresil_sent + 1 WHERE id = ?", [moverId], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                        moverCount = rows[0].bresil_sent + 1;
                    }
                    else {
                        client.dbClient.updateDB("INSERT INTO bot_bresil (id, username, bresil_sent) VALUES (?, ?, 1)", [moverId, mover.user.username], (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                });

                const brasilChannel = client.channels.cache.get(brasilChannelId) as VoiceChannel;
                await member.voice.setChannel(brasilChannel);

                const replyEmbed = new EmbedBuilder()
                    .setColor("Fuchsia")
                    .setTitle(`💨Brasiled`)
                    .addFields(
                        {
                            name: `Mover: `,
                            value: `<@${mover.user.id}>`,
                            inline: false,
                        },
                        {
                            name: `Moved: `,
                            value: `<@${member.user.id}> to <#${brasilChannelId}> !`,
                            inline: false,
                        },
                        {
                            name: `count:`,
                            value: `${moveCount} times!`,
                            inline: false,
                        },
                        {
                            name: `moved people: `,
                            value: `${moverCount} times!`,
                            inline: false,
                        }
                    );

                await logChannel.send({ embeds: [replyEmbed] });
                res.status(200).send('OK!');
            }
            catch (err) {
                console.log(err);
                res.status(500).json({error: 'Internal error!'});
            }
        })
    );
}


