import { Logger } from "../../../logger/Logger"
import BotClient from "../../../botClient/BotClient"
import express = require("express")
import expressFileUpload = require("express-fileupload")
import path = require("path")

import { Storage } from "@google-cloud/storage"

const googleCloudStorage = new Storage({
    projectId: "bot-discord-381816",
    keyFilename: path.join(__dirname, "../../../bot-discord-381816-49aa8d63267a.json", )
})

const bucket = googleCloudStorage.bucket("afho_glams")

const router = express.Router()
router.use(expressFileUpload())

export default function addGlamour(client: BotClient) {
	return router.post("/", async (req, res) => {
		if (!client.ready) return res.status(406).json({ error: "Bot is not ready!" })
        try {
            const access_token = req.body.access_token
			if (!access_token) return res.status(406).send({ error: "No Access Token!" })

			const user = await client.supabaseClient.auth.getUser(access_token)
			if (!user || user.error) return res.status(406).send({ error: "Invalid Access Token!" })

			const guild = client.guilds.cache.get(client.config.serverID)
			if (!guild) return res.status(406).send({ error: "Server not found!" })

			const member = guild.members.cache.get(user.data?.user?.user_metadata.provider_id)
			if (!member) return res.status(406).send({ error: "Member not found!" })

            if (!req.files) return res.status(400).json({ error: "No files were uploaded." })

            const file = req.files.file as expressFileUpload.UploadedFile
            const name = req.body.name

            if (!file) return res.status(400).json({ error: "No file uploaded" })
            if (!name) return res.status(400).json({ error: "No name provided" })

            const fileName = `${member.id}_${Date.now()}_${file.name}`

            bucket.file(fileName).createWriteStream({
                resumable: false,
                gzip: true,
                contentType: file.mimetype,
            }).on("error", (err) => {
                Logger.error(err)
                return res.status(500).json({ error: "Internal error" })
            }).on("finish",async () => {
                const url = `https://storage.googleapis.com/afho_glams/${fileName}`

                const _ = await client.prisma.glamours.create({
                    data: {
                        userId: member.id,
                        name: name,
                        url
                    }
                }).catch(err => {
                    Logger.error(err)
                    return res.status(500).json({ error: "Internal error" })
                })

                return res.status(200).json({ message: "ok", url })
            }).end(file.data)

		} catch (err) {
			Logger.error(err)
			res.status(500).json({ error: "Internal error" })
		}
	})
}
