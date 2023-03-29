import express = require("express");
import BotClient from "../../../botClient/BotClient";
const router = express.Router();

export default function (client: BotClient) {
    return (
        router.post("/", async (req, res) => {
            if (!client.currentChannel) return res.status(406).send("not connected!");

            try {
                await client.leaveVoiceChannel(client.currentChannel);
                res.status(200).send("disconnected");
            }
            catch (err) {
                console.error(err);
                res.status(500).send("Internal error!");
            }
        })
    );
}