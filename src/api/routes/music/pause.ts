import express = require("express")
import type BotClient from "#/botClient/BotClient"
import pause from "#/functions/commandUtils/music/pause"
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

            const response = await pause(client, user.data.user?.user_metadata.full_name)
            if (response.status === 200) return res.status(200).json({ message: response.message })
            return res.status(406).json({ error: response.error })
        } catch (err) {
            Logger.error(err)
            return res.status(500).json({ error: err })
        }
    })
}
