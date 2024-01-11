import express = require("express")
import type BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"

const router = express.Router()

export default function verifiedUser(client: BotClient) {
    return router.post("/", async (req, res) => {
        if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            const access_token = req.body.access_token
            if (!access_token) return res.status(406).send({ error: "No Access Token!" })

            const user = await client.supabaseClient.auth.getUser(access_token)
            if (!user || user.error) return res.status(406).send({ error: "Invalid Access Token!" })

            const guild = client.guilds.cache.get(client.config.serverID)
            if (!guild) return res.status(406).send({ error: "Server not found!" })

            const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
            if (!member) return res.status(406).send({ error: "Member not found!" })

            if (!req.body.lodestone_id) return res.status(400).json({ error: "Missing id" })

            try {
                await client.prisma.users.update({
                    where: {
                        id: member.id
                    },
                    data: {
                        lodestone_id: String(req.body.lodestone_id)
                    }
                })
                res.json({ success: true })
            } catch (err) {
                Logger.error(err)
                return res.status(500).send({ error: "Internal error" })
            }
        } catch (err) {
            Logger.error(err)
            res.status(500).json({ error: "Internal error" })
        }
    })
}
