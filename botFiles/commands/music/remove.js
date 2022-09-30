const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes the song!')
        .addStringOption(option =>
            option.setName('queuenumber')
                .setDescription('Song queue number!')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch(() => null);
        // get an old connection
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

        const arg = interaction.options.getString('queuenumber');

        if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
            return interaction.reply({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${!isNaN(arg) ? interaction.client.queuePos(Number(arg)) : arg} Song.**` });
        }

        queue.skipped = true;

        queue.tracks.splice(arg, 1);

        return interaction.reply(`⏭️ **Successfully removed the ${interaction.client.queuePos(Number(arg))} Track!**`).catch(() => null);
    },
};