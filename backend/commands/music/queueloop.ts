import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueloop')
        .setDescription('Toggles the Queue-Loop!'),
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
        if (queue.trackloop) queue.trackloop = false;

        // no new songs (and no current)
        queue.queueloop = !queue.queueloop;
        // skip the track

        return interaction.reply(`🔂 **Queue-Loop is now \`${queue.queueloop ? "Enabled" : "Disabled"}\`**`).catch((err) => console.log(err));
    },
};