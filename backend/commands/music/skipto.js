const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('skips to the song number you choose in the queue!')
        .addStringOption(option =>
            option.setName('tracknumber')
                .setDescription('Number of the track you want to skip to in the queue!')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(() => null);

        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch(() => null);
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch(() => null);

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch(() => null);
        }
        // no new songs (and no current)
        if (!queue.tracks || queue.tracks.length <= 1) {
            return interaction.reply(`👎 **Nothing to skip**`).catch(() => null);
        }

        const arg = interaction.options.getString("tracknumber");
        if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) return interaction.reply({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't skip to ${arg}th Song.**` });

        queue.skipped = true;

        // if there is a queueloop: remove the current track but keep the rest
        if (queue.queueloop) {
            for (let i = 1; i <= arg - 1; i++) {
                queue.tracks.push(queue.tracks[i]);
            }

        }
        queue.tracks = queue.tracks.slice(arg - 1);

        // skip the track
        oldConnection.state.subscription.player.stop();

        return interaction.reply(`⏭️ **Successfully skipped ${arg} Track(s)**`).catch(() => null);
    },
};