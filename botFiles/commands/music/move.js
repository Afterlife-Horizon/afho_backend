const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Moves song in queue!')
        .addStringOption(option =>
            option.setName('from')
                .setDescription('queue number of song to move!')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('to')
                .setDescription('queue number of song to replace')
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

        const args = [interaction.options.getString("from"), interaction.options.getString("to")];

        if (!args[0] || isNaN(args[0]) || Number(args[0]) < 1 || !args[1] || isNaN(args[1]) || Number(args[1]) < 1) {
            return interaction.reply(`👎 **From where to where shall I move?** Usage: \`/move <fromPosNr.> <toPosNr.>\``).catch(() => null);
        }


        queue.tracks = arrayMove(queue.tracks, args[0], args[1]);

        return interaction.reply(`🪣 **Successfully moved the \`${interaction.client.queuePos(args[0])} Song\` to \`${interaction.client.queuePos(args[1])} Position\` in the Queue.**`).catch(() => null);
    },
};

function arrayMove(array, from, to) {
    try {
        array = [...array];
        const startIndex = from < 0 ? array.length + from : from;
        if (startIndex >= 0 && startIndex < array.length) {
            const endIndex = to < 0 ? array.length + to : to;
            const [item] = array.splice(from, 1);
            array.splice(endIndex, 0, item);
        }
        return array;
    }
    catch (e) {
        console.log(String(e.stack).grey.bgRed);
    }
}