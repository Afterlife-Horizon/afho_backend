import BotClient from "../BotClient";

require('dotenv').config();

// --------- importing database ---------

export default function (client: BotClient) {
    return (
        client.on("messageCreate", async (message) => {
            if (message.author.bot) return;
            if (!message.guild) return;
            try {
                client.dbClient.selectFromDB("SELECT * FROM bot_levels WHERE id = ?", [message.author.id], (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    else if (rows.length > 0) {
                        client.dbClient.updateDB("UPDATE bot_levels SET xp = xp + 1 WHERE id = ?", [message.author.id], (err) => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    }
                    else {
                        client.dbClient.updateDB("INSERT INTO bot_levels(id, username, xp) VALUES (?, ?, 1)", [message.author.id, message.author.username], (err) => {
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