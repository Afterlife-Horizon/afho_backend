import express from "express"
import { Express } from "express"
import type BotClient from "../botClient/BotClient"

// ------------ api routes ------------
import levels from "./routes/levels"

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
import times from "./routes/times"
import test from "./routes/test"
import addGlamour from "./routes/ff14/addGlamour"
import achievements from "./routes/achievements"
import { Logger } from "../logger/Logger"

export default class ExpressClient {
	public app: Express
	private client: BotClient
	constructor(client: BotClient) {
		this.client = client
		this.app = express()
		const PORT = process.env.PORT || 4000
		this.app
			.use(express.json())
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
			.use("/test", test(this.client))
			.listen(PORT, () => {
				Logger.log("API is now listening on port 4000")
			})
	}
}
