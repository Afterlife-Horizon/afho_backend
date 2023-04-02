import BotClient from "../BotClient"

require("dotenv").config()

// --------- importing database ---------

export default function (client: BotClient) {
	return client.on("messageCreate", async message => {
		if (message.author.bot) return

		const level = client.prisma.bot_levels.upsert({
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
		}).catch(err => console.error(err))
		console.log(level)
	})
}
