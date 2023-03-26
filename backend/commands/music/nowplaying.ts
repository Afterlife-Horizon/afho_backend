import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Shows information about the current song!'),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));
        // get an old connection
        const oldConnection = getVoiceConnection(interaction.guild.id);
        if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch((err) => console.log(err));
        if (oldConnection && oldConnection.joinConfig.channelId != interaction.member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));

        const queue = interaction.client.queues.get(interaction.guild.id);
        if (!queue || !queue.tracks || !queue.tracks[0]) {
            return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
        }
        const song = queue.tracks[0];
        const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;

        const songEmbed = new EmbedBuilder().setColor("FUCHSIA")
            .setTitle(`${song.title}`)
            .setURL(interaction.client.getYTLink(song.id))
            .addFields(
                { name: `ℹ️ **Upload-Channel:**`, value: `> ${song ? `[${song.channel.name}](${song.channel.url})` : `\`Unknown\``}`, inline: true },
                { name: `📅 **Upload-At:**`, value: `> ${song.uploadedAt}`, inline: true },
                { name: `💯 **Requester:**`, value: `> ${song.requester} \`${song.requester.tag}\``, inline: true },
                { name: `⏳ **Duration:**`, value: `> ${interaction.client.createBar(song.duration, curPos)}\n> **${interaction.client.formatDuration(curPos)} / ${song.durationFormatted}**` },
            );
        if (song?.thumbnail?.url) songEmbed.setImage(`${song?.thumbnail?.url}`);

        return interaction.reply({ content: `ℹ️ **Nowplaying Track**`, embeds: [songEmbed] }).catch((err) => console.log(err));
    },
};