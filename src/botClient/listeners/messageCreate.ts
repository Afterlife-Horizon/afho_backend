import { PrismaClient } from "@prisma/client"
import BotClient from "../BotClient"

const prisma = new PrismaClient()
require("dotenv").config()

// --------- importing database ---------

export default function (client: BotClient) {
	return client.on("messageCreate", async message => {
		if (message.author.bot) return
		if (!message.guild) return

		prisma.bot_levels.upsert({
			where: {
				id: message.author.id
			},
			update: {
				xp: {
					increment: 1
				}
			},
			create: {
				id: message.author.id,
				username: message.author.username,
				xp: 1
			}
		})
	})
}
