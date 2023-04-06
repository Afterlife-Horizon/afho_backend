import { Events, AuditLogEvent } from "discord.js"
import BotClient from "../BotClient"

export default function (client: BotClient) {
	return client.on(Events.GuildAuditLogEntryCreate, async auditLog => {
		const { action, executorId, target, targetId } = auditLog
		console.log(auditLog)

		// Check only for deleted messages.
		if (action !== AuditLogEvent.MemberMove) return

		// check if the target is a user and waws moved in bresil
	})
}
