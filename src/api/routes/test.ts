import express = require("express")
import BotClient from "../../botClient/BotClient"
const router = express.Router()

export default function (client: BotClient) {
	return router.get("/", (req, res) => {
		res.send(client)
	})
}
