import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js"
import fs from "fs"
import path from "node:path"
import request from "request"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("addchatsound")
            .setDescription("Add a sound reaction to the server.")
            .addStringOption(option => option.setName("word").setDescription("Enter here the word that triggers this sound.").setRequired(true))
            .addAttachmentOption(option => option.setName("sound").setDescription("The mp3 file for the sound.").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        async execute(interaction) {
            await interaction.deferReply()
            const word = interaction.options.get("word")?.value as string
            const sound = interaction.options.get("sound", true).attachment

            const dirPath = path.resolve(__dirname, "../../../assets/sounds")
            const filePath = path.resolve(dirPath, `${word}.mp3`)
            if (!fs.existsSync(dirPath)) fs.mkdirSync("./sounds")
            if (fs.existsSync(filePath)) return await interaction.followUp("Sound already exists")
            if (!sound?.url.endsWith(".mp3")) return await interaction.followUp("Sound must be an mp3 file")
            try {
                var promise = request(sound.url)
                promise.pipe(fs.createWriteStream(filePath))

                await client.prisma.sounds.create({
                    data: {
                        word: word,
                        path: word
                    }
                })

                await interaction.followUp("Sound added")
            } catch (err) {
                Logger.error(err)
            }
        }
    }
}
