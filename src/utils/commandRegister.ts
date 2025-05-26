import BotClient from "#/botClient/BotClient"
import { Logger } from "#/logger/Logger"
import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js"
import { exit } from "process"

export default function commandRegister(client: BotClient) {
    const rest = new REST({ version: "10" }).setToken(client.config.token)
    if (process.env.METHOD === "add") {
        Logger.log("Registering application commands...")
        const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
        for (const [name, command] of client.commands) {
            Logger.log("Registering command: " + name)
            commands.push(command.data.toJSON())
        }
        rest.put(Routes.applicationCommands(client.config.clientID), {
            body: commands
        })
            .then((data: any) => Logger.log(`Successfully registered ${data.length} application commands.`))
            .then(() => exit(0))
            .catch(Logger.error)
    }

    if (process.env.METHOD === "delete") {
        Logger.log("Deleting all application commands...")
        rest.put(Routes.applicationCommands(client.config.clientID), {
            body: []
        })
            .then(() => Logger.log("Successfully deleted all application commands."))
            .then(() => exit(0))
            .catch(Logger.error)
    }
}
