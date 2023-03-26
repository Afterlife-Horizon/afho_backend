import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('shuffles the queue!'),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");

            const oldConnection = getVoiceConnection(interaction.guildId);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
            if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!");

            const queue = interaction.client.queues.get(interaction.guildId);
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`);
            }

            const tmpsong = queue.tracks[0];
            queue.tracks = shuffleArray(queue.tracks.slice(1));
            if (queue.tracks.length === 0) return;
            queue.tracks.unshift(tmpsong);

            return interaction.reply(`🔀 **Successfully shuffled the Queue.**`);
        }
        catch (err) {
            console.log(err);
        }
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