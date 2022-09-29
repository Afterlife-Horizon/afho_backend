const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('Set the bass boosting!')
        .addStringOption(option =>
            option.setName('db')
                .setDescription('From -20 to +20!')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(() => null);
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(() => null);

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`);
        }
        const arg = interaction.options.getString('db');
        if (arg === undefined || isNaN(arg) || Number(arg) < 0 || Number(arg) > 20) return interaction.reply(`👎 **No __valid__ Bassboost-Level between 0 and 20 db provided!** Usage: \`/bassboost 6\``).catch(() => null);
        const bassboost = Number(arg);
        queue.effects.bassboost = bassboost;

        // change the Basslevel
        queue.filtersChanged = true;
        const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;
        oldConnection.state.subscription.player.stop();
        oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, curPos));

        return interaction.reply(`🎚 **Successfully changed the Bassboost-Level to \`${bassboost}db\`**`).catch(() => null);
    },
};