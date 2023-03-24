const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Set the speed of the song!')
        .addStringOption(option =>
            option.setName('speed')
                .setDescription('The speed you would like! (in %)')
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

        const arg = interaction.options.getString('speed');
        if (arg === undefined || isNaN(arg) || Number(arg) < 50 || Number(arg) > 300) return interaction.reply(`👎 **No __valid__ Bassboost-Level between 50 and 300 % provided!** (100 % == normal speed)\n Usage: \`/speed 125\``).catch(() => null);
        const speed = Number(arg);
        queue.effects.speed = Math.floor(speed) / 100;

        // change the Basslevel
        queue.filtersChanged = true;
        const curPos = oldConnection.state.subscription.player.state.resource?.playbackDuration || 0;
        oldConnection.state.subscription.player.stop();
        oldConnection.state.subscription.player.play(interaction.client.getResource(queue, queue.tracks[0].id, curPos));

        return interaction.reply(`🎚 **Successfully changed the Speed to \`${Math.floor(speed) / 100}x\` of the Original Speed (${speed}%)**`).catch(() => null);
    },
};