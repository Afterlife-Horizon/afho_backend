import express = require("express")
const router = express.Router()
const request = require("undici").request
require("dotenv").config()

async function getJSONResponse(body) {
	let fullBody = ""

	for await (const data of body) {
		fullBody += data.toString()
	}
	return JSON.parse(fullBody)
}

export default function () {
	return router.post("/", async (req, res) => {
		if (!req.body || !req.body.code) return res.status(406).send("no code")

		try {
			const params = new URLSearchParams()
			params.append("client_id", "1028294291698765864")
			params.append("client_secret", "PQI01KT2dwee50HuE853-AJg_i1uE-nW")
			params.append("grant_type", "authorization_code")
			params.append("code", String(req.body.code))
			params.append("redirect_uri", process.env.DISCORD_REDIRECT_URI || "")
			params.append("scope", "identify")

			const tokenResponseData = await request("https://discord.com/api/oauth2/token", {
				method: "POST",
				body: params.toString(),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			})
			if (tokenResponseData.statusCode === 401) {
				return res.status(406).send(tokenResponseData.body)
			}

			const oauthData = await getJSONResponse(tokenResponseData.body)
			res.status(200).json(oauthData)
		} catch (error) {
			console.error(error)
			res.status(500).send("Internal Error")
		}
	})
}
