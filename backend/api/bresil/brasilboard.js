const express = require("express");
const router = express.Router();

const { selectFromDB } = require(process.env.WORKPATH + "DB/DB_functions");

function compareData(count1, count2) {
    if (count1.bresil_received > count2.bresil_received) return -1;
    else if (count1.bresil_received < count2.bresil_received) return 1;
    return 0;
}

module.exports = function (client) {
    return ( 
        router.get("/", async (req, res) => {
            try {
                const ids = [];
                const bresils = [];
                selectFromDB("afho", "SELECT * FROM bot_levels", [], (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    else if (rows.length > 0) {
                        rows.forEach(row => {
                            ids.push(row.id);
                            bresils.push({ 
                                id: row.id,
                                bresil_received: row.bresil_received,
                                bresil_sent: row.bresil_sent,
                            });
                        });
                    }
                });
    
                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
    
                await guild.members.fetch();
                const members = guild.members.cache.filter(m => ids.includes(m.id));
    
                const sendData = members.map(m => {
                    const bresil = bresils.find(move => move.id === m.id);
                    return {
                        user: m,
                        received: bresil.bresil_received, 
                        sent: bresil.bresil_sent 
                    };
                });

                console.log(sendData.sort(compareData));

                res.json(sendData.sort(compareData));
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Internal error"});
            }

            
        })
    );
}
