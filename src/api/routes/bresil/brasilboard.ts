import express = require("express");
import { APIBresil, Bresil } from "../../../types";
import BotClient from "../../../botClient/BotClient";
const router = express.Router();

function compareData(count1, count2) {
    if (count1.bresil_received > count2.bresil_received) return -1;
    else if (count1.bresil_received < count2.bresil_received) return 1;
    return 0;
}

export default function (client: BotClient) {
    return ( 
        router.get("/", async (_, res) => {
            try {
                const ids : string[] = [];
                const bresils : Bresil[] = [];
                client.dbClient.selectFromDB("SELECT * FROM bot_bresil", [], (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    else if (rows.length > 0) {
                        rows.forEach((row : APIBresil) => {
                            ids.push(row.id);
                            bresils.push({
                                id: row.id,
                                bresil_received: row.bresil_received,
                                bresil_sent: row.bresil_sent,
                            });
                        });
                    }
                });
    
                const guild = client.guilds.cache.find(g => g.name === client.config.serverName);

                if (!guild) return res.status(406).json({error: 'Guild not found!'});
    
                await guild.members.fetch();
    
                const sendData = bresils.map(bresil => {
                    const member = guild.members.cache.find(mem => mem.user.id === bresil.id);
                    return {
                        user: member,
                        bresil_received: bresil.bresil_received, 
                        bresil_sent: bresil.bresil_sent 
                    };
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
