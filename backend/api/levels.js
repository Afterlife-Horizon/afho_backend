const express = require("express");
const router = express.Router();

function compareData(count1, count2) {
    if (count1.xp > count2.xp) return -1;
    else if (count1.xp < count2.xp) return 1;
    return 0;
}


const { selectFromDB } = require("../DB/DB_functions");
const getLevelFromXp = require("../functions/getLevelFromXp");

module.exports = function (client) {
    return (
        router.get("/", async (req, res) => {
            try {
                const ids = [];
                const levels = [];
                selectFromDB("afho", "SELECT * FROM bot_levels", [], (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    else if (rows.length > 0) {
                        rows.forEach(row => {
                            ids.push(row.id);
                            levels.push({ 
                                id: row.id, 
                                xp: row.xp, 
                                lvl: getLevelFromXp(row.xp) 
                            });
                        });
                    }
                });

                const guild = client.guilds.cache.find(g => g.name === "Afterlife Horizon");
        
                await guild.members.fetch();
                const members = guild.members.cache.filter(m => ids.includes(m.id));

                const sendData = members.map(m => {
                    const level = levels.find(move => move.id === m.id);
                    return { user: m, xp: level.xp, lvl: level.lvl };
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