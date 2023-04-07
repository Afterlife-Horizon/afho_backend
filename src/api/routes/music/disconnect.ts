import express = require("express")
import BotClient from "../../../botClient/BotClient"
import disconnect from "../../../functions/commandUtils/music/disconnect"

const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		if (!client.currentChannel) return res.status(406).send("not connected!")

		const access_token = req.body.access_token

		if (!access_token) return res.status(406).send({ error: "No Access Token!" })

		const user = await client.supabaseClient.auth.getUser(access_token)

		if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

		const guild = await client.guilds.fetch(client.config.serverID)
		if (!guild) return res.status(406).send("Server not found!")

		const admins = (await guild.roles.fetch(client.config.adminRoleID))?.members

		if (!admins) return res.status(406).send("Admins not found!")

		if (!admins.has(user.data?.user?.user_metadata.provider_id)) return res.status(406).send("You are not an admin!")

		const response = await disconnect(client)

		if (response.status === 200) return res.status(200).json({ message: response.message })
		res.status(response.status).json({ error: response.error })
	})
}
