import { getVoiceConnection } from "@discordjs/voice"
import { GuildMember, SlashCommandBuilder } from "discord.js"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("remove")
            .setDescription("Removes the song!")
            .addStringOption(option => option.setName("queuenumber").setDescription("Song queue number!").setRequired(true)),
        async execute(interaction) {
            const member = interaction.member as GuildMember
            const guild = interaction.guild
            if (!guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))

            if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

            const oldConnection = getVoiceConnection(guild.id)
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(err => Logger.error(err.message))
            if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId)
                return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(err => Logger.error(err.message))

            const queue = client.musicHandler.queues.get(guild.id)
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`).catch(err => Logger.error(err.message))
            }

            if (!queue.tracks || queue.tracks.length <= 1) {
                return interaction.reply(`👎 **Nothing to skip**`).catch(err => Logger.error(err.message))
            }

            const arg = interaction.options.get("queuenumber")?.value as number

            if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
                return interaction.reply({
                    content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${
                        !isNaN(arg) ? client.musicHandler.queuePos(Number(arg)) : arg
                    } Song.**`
                })
            }

            queue.skipped = true

            queue.tracks.splice(arg, 1)

            return interaction
                .reply(`⏭️ **Successfully removed the ${client.musicHandler.queuePos(Number(arg))} Track!**`)
                .catch(err => Logger.error(err.message))
        }
    }
}
