import ExpressClient from "#/api/ExpressClient"
import BotClient from "#/botClient/BotClient"
import reactionCollector from "#/botClient/collectors/reactionCollector"
import { Logger } from "#/logger/Logger"
import { exit } from "process"
import commandRegister from "./utils/commandRegister"
import configCheck from "./utils/configCheck"
import { botOptions } from "./utils/constants"
import initStopListeners from "./utils/initStopListeners"

Logger.init()

const environement = configCheck()

const client = new BotClient(botOptions, environement)

async function timer() {
    client.cacheHandler.updateCache()
    client.fetchGameFeeds()
    client.checkBirthdays()

    setTimeout(timer, 1000 * 60)
}

client.once("ready", async () => {
    client.ready = true
    Logger.log("Logged in as " + client.user?.tag)
    reactionCollector(client)
    await client.initVars()
    await timer()
})

if (process.env.METHOD) commandRegister(client)
else {
    new ExpressClient(client)
    client.login(client.config.token).catch(err => {
        Logger.error(err)
        exit(1)
    })
}

initStopListeners(client)
