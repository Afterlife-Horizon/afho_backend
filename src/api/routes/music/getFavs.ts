import express = require("express")
import BotClient from "../../../botClient/BotClient"
import { IFavorite } from "../../../types"
import { Logger } from "../../../logger/Logger"
const router = express.Router()

export default function (client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
		try {
			if (!req.body) return res.status(406).send({ error: "No Body!" })

			const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = await client.guilds.fetch(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = await guild.members.fetch(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

			const favorites: IFavorite[] = await client.prisma.bot_favorites.findMany({
				where: {
					user_id: user.data?.user?.user_metadata.provider_id
				},
				orderBy: {
					name: "asc"
				},
				skip: req.body.skip * 5 || 0,
				take: 5
			})

			res.status(200).json({ favorites })
		} catch (err) {
			if (err instanceof Error) Logger.error(err.message)
			res.status(500).send("Internal Server Error")
		}
	})
}
