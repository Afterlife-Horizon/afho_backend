require('dotenv').config();

// --------- importing database ---------

const { updateDB, selectFromDB } = require("../DB/DB_functions");


const exp = 3;
const getLevel = xp => {
    return Math.floor(Math.pow((xp / exp), 1 / exp));
}

module.exports = function (client) {
    return (
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (!message.guild) return;
            try {
                selectFromDB("afho", "SELECT * FROM bot_levels WHERE id = ?", [message.author.id], (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    else if (rows.length > 0) {
                        updateDB("afho", "UPDATE bot_levels SET xp = xp + 1 WHERE id = ?", [message.author.id], (err) => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    }
                    else {
                        updateDB("afho", "INSERT INTO bot_levels(id, username, xp) VALUES (?, 1)", [message.author.username, message.author.id], (err) => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    }
                });
            }
            catch (error) {
                console.error(error);
            }
        })
    );
}