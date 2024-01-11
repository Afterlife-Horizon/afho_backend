import express, { Express } from "express"
import http from "http"
import https from "https"
import sslRootCAs from "ssl-root-cas"
import type BotClient from "#/botClient/BotClient"

// ------------ api routes ------------
import levels from "./routes/levels"

// ------------ bresil ------------
import bresilMember from "./routes/bresil/brasil"
import brasilBoard from "./routes/bresil/brasilboard"
import connectedMembers from "./routes/bresil/connectedMembers"

// ------------ music ------------
import cors from "cors"
import fs from "fs"
import { Logger } from "#/logger/Logger"
import achievements from "./routes/achievements"
import addGlamour from "./routes/ff14/addGlamour"
import verifiedUser from "./routes/ff14/verifiedUser"
import getUser from "./routes/getUser"
import musicAddFav from "./routes/music/addFav"
import musicClearQueue from "./routes/music/clearQueue"
import musicRemoveFav from "./routes/music/delFav"
import musicDisconnect from "./routes/music/disconnect"
import musicFetch from "./routes/music/fetch"
import musicFilters from "./routes/music/filters"
import musicGetFavs from "./routes/music/getFavs"
import musicPause from "./routes/music/pause"
import musicPlay from "./routes/music/play"
import musicPlayFirst from "./routes/music/playFirst"
import musicRemove from "./routes/music/remove"
import musicShuffle from "./routes/music/shuffle"
import musicSkip from "./routes/music/skip"
import musicSkipto from "./routes/music/skipto"
import musicStop from "./routes/music/stop"
import musicResume from "./routes/music/unpause"
import times from "./routes/times"

export default class ExpressClient {
    private server: https.Server | http.Server
    private app: Express
    private client: BotClient
    constructor(client: BotClient) {
        this.client = client
        this.app = express()
        const PORT = Number(process.env.PORT) || 4000
        this.app
            .use(express.json())
            .use(cors())
            .get("/", (_, res) => res.send("Server running correctly"))
            .use("/levels", levels(this.client))
            .use("/brasilBoard", brasilBoard(this.client))
            .use("/connectedMembers", connectedMembers(this.client))
            .use("/bresilMember", bresilMember(this.client))
            .use("/skip", musicSkip(this.client))
            .use("/pause", musicPause(this.client))
            .use("/unpause", musicResume(this.client))
            .use("/stop", musicStop(this.client))
            .use("/clearqueue", musicClearQueue(this.client))
            .use("/shuffle", musicShuffle(this.client))
            .use("/skipto", musicSkipto(this.client))
            .use("/remove", musicRemove(this.client))
            .use("/disconnect", musicDisconnect(this.client))
            .use("/play", musicPlay(this.client))
            .use("/playfirst", musicPlayFirst(this.client))
            .use("/filters", musicFilters(this.client))
            .use("/fetch", musicFetch(this.client))
            .use("/getFavs", musicGetFavs(this.client))
            .use("/addFav", musicAddFav(this.client))
            .use("/delFav", musicRemoveFav(this.client))
            .use("/times", times(this.client))
            .use("/achievements", achievements(this.client))
            .use("/addGlamour", addGlamour(this.client))
            .use("/getUser", getUser(this.client))
            .use("/verifiedUser", verifiedUser(this.client))
        if (client.config.cert && client.config.certKey) {
            let cas = sslRootCAs.create()
            if (process.env.CA_CERT) cas.addFile(client.config.caCert)
            const hostname = "api.local.afterlifehorizon.net"

            const sslOptions = {
                key: fs.readFileSync(client.config.certKey),
                cert: fs.readFileSync(client.config.cert),
                ca: cas,
                servername: hostname
            }
            this.server = https.createServer(sslOptions, this.app)
        } else this.server = http.createServer(this.app)

        this.server.on("listening", () => {
            Logger.log(`API is now listening on port ${PORT}`)
        })
        this.server.on("error", err => Logger.error(err))
        this.server.listen(PORT)
    }
}
