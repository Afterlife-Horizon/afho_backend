import { GuildMember, SlashCommandBuilder } from "discord.js"
import changeFilters from "#/functions/commandUtils/music/filters"
import { Logger } from "#/logger/Logger"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("bassboost")
            .setDescription("Set the bass boosting!")
            .addStringOption(option => option.setName("db").setDescription("From -20 to +20!").setRequired(true)),
        async execute(interaction) {
            const member = interaction.member as GuildMember
            const guild = interaction.guild

            if (!member || !guild) return interaction.reply("👎 **Something went wrong**").catch(err => Logger.error(err.message))
            if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(err => Logger.error(err.message))

            const queue = client.musicHandler.queues.get(guild.id)
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`)
            }
            const arg = interaction.options.get("db")?.value as number
            if (arg === undefined || isNaN(arg) || Number(arg) < 0 || Number(arg) > 20)
                return interaction
                    .reply(`👎 **No __valid__ Bassboost-Level between 0 and 20 db provided!** Usage: \`/bassboost 6\``)
                    .catch(err => Logger.error(err.message))
            const bassboost = Number(arg)
            queue.effects.bassboost = bassboost
            queue.filtersChanged = true

            const res = await changeFilters(client, { member: member })
            if (res.error) interaction.reply({ content: res.error, ephemeral: true })

            return interaction.reply(`🎚 **Successfully changed the Bassboost-Level to \`${bassboost}db\`**`).catch(err => Logger.error(err.message))
        }
    }
}
