import express = require("express")
import type BotClient from "#/botClient/BotClient"
import musicStop from "#/functions/commandUtils/music/musicStop"
import { Logger } from "#/logger/Logger"
const router = express.Router()

export default function (client: BotClient) {
    return router.post("/", async (req, res) => {
        try {
            if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })

            const access_token = req.body.access_token
            if (!access_token) return res.status(406).send({ error: "No Access Token!" })

            const user = await client.supabaseClient.auth.getUser(access_token)
            if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

            const guild = client.guilds.cache.get(client.config.serverID)
            if (!guild) return res.status(406).send("Server not found!")

            const admins = guild.roles.cache.get(client.config.adminRoleID)?.members

            if (!admins) return res.status(406).send("Admins not found!")

            if (!admins.has(user.data?.user?.user_metadata.provider_id)) return res.status(406).send("You are not an admin!")

            const result = await musicStop(client, user.data.user?.user_metadata.full_name)

            if (result.status === 200) return res.status(200).json({ message: result.message ? result.message : "👍" })
            return res.status(result.status).json({ error: result.error ? result.error : "👎" })
        } catch (err) {
            Logger.error(err)
            return res.status(500).json({ error: err })
        }
    })
}
