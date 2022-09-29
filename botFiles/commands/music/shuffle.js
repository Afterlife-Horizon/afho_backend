const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('shuffles the queue!'),
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
        queue.tracks = shuffleArray(queue.tracks);

        // shuffled the Queue
        return interaction.reply(`🔀 **Successfully shuffled the Queue.**`).catch(() => null);
    },
};

function shuffleArray(a) {
    let cI = a.length, rI;
    while (cI != 0) {
        rI = Math.floor(Math.random() * cI);
        cI--;
        [a[cI], a[rI]] = [a[rI], a[cI]];
    }
    return a;
}