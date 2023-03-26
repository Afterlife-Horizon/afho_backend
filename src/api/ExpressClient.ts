import connectHistoryApiFallback from 'connect-history-api-fallback';
import express from 'express';
import { Express } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import BotClient from '../botClient/BotClient';

// ------------ api routes ------------
import levels from "./routes/levels.js";

// ------------ bresil ------------
import brasilBoard from "./routes/bresil/brasilboard"
import connectedMembers from "./routes/bresil/connectedMembers"
import bresilMember from "./routes/bresil/brasil"

// ------------ music ------------
import musicSkip from "./routes/music/skip"
import musicPause from "./routes/music/pause"
import musicResume from "./routes/music/unpause"
import musicStop from "./routes/music/stop"
import musicClearQueue from "./routes/music/clearQueue"
import musicShuffle from "./routes/music/shuffle"
import musicSkipto from "./routes/music/skipto"
import musicRemove from "./routes/music/remove"
import musicPlay from "./routes/music/play"
import musicPlayFirst from "./routes/music/playFirst"
import musicDisconnect from "./routes/music/disconnect"
import musicFilters from "./routes/music/filters"
import musicFetch from "./routes/music/fetch"
import musicGetFavs from "./routes/music/getFavs"
import musicAddFav from "./routes/music/addFav"
import musicRemoveFav from "./routes/music/delFav"

// ------------ login ------------
import login from "./routes/login/login"
import loginAccess from "./routes/login/loginAccess"


export default class ExpressClient {
    public app: Express;
    private client: BotClient;
    constructor(client: BotClient) {
        this.client = client;
        this.app = express();
        this.app.use(express.json());
        this.initRoutes();
        this.app.use(connectHistoryApiFallback({ verbose: false }))
                .use(express.static(path.join(__dirname, "../frontend/dist")))
    }

    private initRoutes() {
        this.app.use("/api/levels", levels(this.client))
        this.app.use("/api/brasilBoard", brasilBoard(this.client))
        this.app.use("/api/connectedMembers", connectedMembers(this.client))
        this.app.use("/api/bresilMember", bresilMember(this.client))
        this.app.use("/api/skip", musicSkip(this.client))
        this.app.use("/api/pause", musicPause(this.client))
        this.app.use("/api/unpause", musicResume(this.client))
        this.app.use("/api/stop", musicStop(this.client))
        this.app.use("/api/clearqueue", musicClearQueue(this.client))
        this.app.use("/api/shuffle", musicShuffle(this.client))
        this.app.use("/api/skipto", musicSkipto(this.client))
        this.app.use("/api/remove", musicRemove(this.client))
        this.app.use("/api/disconnect", musicDisconnect(this.client))
        this.app.use("/api/play", musicPlay(this.client))
        this.app.use("/api/playfirst", musicPlayFirst(this.client))
        this.app.use("/api/filters", musicFilters(this.client))
        this.app.use("/api/fetch", musicFetch(this.client))
        this.app.use("/api/getFavs", musicGetFavs(this.client))
        this.app.use("/api/addFav", musicAddFav(this.client))
        this.app.use("/api/delFav", musicRemoveFav(this.client))
        this.app.use("/api/login", login())
        this.app.use("/api/loginaccess", loginAccess())
    }
}