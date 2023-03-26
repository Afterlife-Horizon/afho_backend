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
        this.app.use(express.json())
            .use("/api/levels", levels(this.client))
            .use("/api/brasilBoard", brasilBoard(this.client))
            .use("/api/connectedMembers", connectedMembers(this.client))
            .use("/api/bresilMember", bresilMember(this.client))
            .use("/api/skip", musicSkip(this.client))
            .use("/api/pause", musicPause(this.client))
            .use("/api/unpause", musicResume(this.client))
            .use("/api/stop", musicStop(this.client))
            .use("/api/clearqueue", musicClearQueue(this.client))
            .use("/api/shuffle", musicShuffle(this.client))
            .use("/api/skipto", musicSkipto(this.client))
            .use("/api/remove", musicRemove(this.client))
            .use("/api/disconnect", musicDisconnect(this.client))
            .use("/api/play", musicPlay(this.client))
            .use("/api/playfirst", musicPlayFirst(this.client))
            .use("/api/filters", musicFilters(this.client))
            .use("/api/fetch", musicFetch(this.client))
            .use("/api/getFavs", musicGetFavs(this.client))
            .use("/api/addFav", musicAddFav(this.client))
            .use("/api/delFav", musicRemoveFav(this.client))
            .use("/api/login", login())
            .use("/api/loginaccess", loginAccess())
            .use(connectHistoryApiFallback({ verbose: false }))
            .use(express.static(path.join(__dirname, "../../frontend/dist")));
    }
}