import BotClient from "../BotClient"

export default function (client: BotClient) {
	return client.on("channelUpdate", async auditLog => {
		console.log(auditLog)
	})
}
