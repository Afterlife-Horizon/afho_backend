import BotClient from "../BotClient"

export default function (client: BotClient) {
	return client.on("guildAuditLogEntryCreate", async auditLog => {
		console.log(auditLog)
	})
}
