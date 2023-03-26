import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trackloop')
        .setDescription('Toggles the Track-Loop!'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch((err) => console.log(err));
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
        }
        if (queue.queueloop) queue.queueloop = false;

        // no new songs (and no current)
        queue.trackloop = !queue.trackloop;
        // skip the track

        return interaction.reply(`🔁 **Track-Loop is now \`${queue.trackloop ? "Enabled" : "Disabled"}\`**`).catch((err) => console.log(err));
    },
};