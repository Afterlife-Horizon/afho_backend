import { Events, AuditLogEvent } from "discord.js"
import BotClient from "../BotClient"
import { Logger } from "../../logger/Logger"

export default function (client: BotClient) {
	Logger.log("Loading guildAuditLogEntryCreate listener")
	return client.on(Events.GuildAuditLogEntryCreate, async auditLog => {
		console.log(auditLog)
		const { action, executorId, target, targetId } = auditLog

		// Check only for deleted messages.
		if (action !== AuditLogEvent.MemberMove) return

		// check if the target is a user and waws moved in bresil
	})
}
