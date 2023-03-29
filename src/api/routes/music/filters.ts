import express = require("express");
const router = express.Router();
import { GuildMember } from "discord.js";
import BotClient from "../../../botClient/BotClient";
import changeFilters from "../../../functions/commandUtils/filters";
import { IFilters } from "../../../types";

export default function (client: BotClient) {
    return (
        router.post("/", async (req, res) => {
            const { user, filters } : {user: string, filters: IFilters} = req.body;
            if (!user) return res.status(400).json({ error: "Missing username" });

            const guild = client.guilds.cache.find(g => g.name === process.env.SERVER_NAME);
            if (!guild) return res.status(406).send("Guild not found!");
            
            const connectedMembers = guild.members.cache.filter(member => member.voice.channel);
            const requester = connectedMembers.find((member) => member.user.username === user) as GuildMember;
            if (!requester) return res.status(406).send("User not found!");

            if (!filters) return res.status(400).json({ error: "Missing filter" });

            const queue = client.queues.get(guild.id);
            if (!queue) return res.status(400).json({ error: "No queue found" });

            for (const [key, value] of Object.entries(filters)) {
                queue.effects[key] = value;
            }

            const response = await changeFilters(client, { member: requester })

            if (response.error) return res.status(400).json({ error: response.error });

            return res.status(response.status).json({ message: "OK" });
        })
    );
}