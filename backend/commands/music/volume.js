const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the volume!')
        .addStringOption(option =>
            option.setName('volume')
                .setDescription('From 1 to 150!')
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

        const arg = interaction.options.getString('volume');

        if (!arg || isNaN(arg) || Number(arg) < 1 || Number(arg) > 150) return interaction.reply(`👎 **No __valid__ Volume between 1 and 100 % provided!** Usage: \`/volume 25\``).catch(() => null);
        const volume = Number(arg);
        queue.volume = volume;

        // change the volume
        oldConnection.state.subscription.player.state.resource.volume.setVolume(volume / 100);

        return interaction.reply(`🔊 **Successfully changed the Volume to \`${volume}%\`**`).catch(() => null);
    },
};