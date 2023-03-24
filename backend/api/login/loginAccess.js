const express = require("express");
const router = express.Router();
const request = require("undici").request;

async function getJSONResponse(body) {
	let fullBody = "";

	for await (const data of body) {
		fullBody += data.toString();
	}
	return JSON.parse(fullBody);
}

module.exports = function () {
	return router.post("/", async (req, res) => {
		if (!req.body || !req.body.access_token)
			return res.status(406).send("no code");

		try {
			const userResult = await request("https://discord.com/api/users/@me", {
				headers: {
					authorization: `${req.body.token_type} ${req.body.access_token}`,
				},
			});
			res.status(200).json(await getJSONResponse(userResult.body));
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error
			// tokenResponseData.statusCode will be 401
			console.error(error);
			res.status(500).send("Internal Error");
		}
	});
};
