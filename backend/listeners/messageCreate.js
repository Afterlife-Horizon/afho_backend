require('dotenv').config();

// --------- importing database ---------

const { updateDB } = require("../DB/DB_functions");


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
                updateDB("afho", "UPDATE users SET xp = xp + 1 WHERE id = ?", [message.author.id], (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
            catch (error) {
                console.error(error);
            }
        })
    );
}