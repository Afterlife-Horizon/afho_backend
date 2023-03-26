import { SlashCommandBuilder, EmbedBuilder, GuildMember, Colors } from 'discord.js';
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand, IESong } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('nowplaying')
            .setDescription('Shows information about the current song!'),
        async execute(interaction) {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild;
            if (!guild) return interaction.reply("👎 **Something went wrong**").catch((err) => console.log(err));
            if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));
            
            const oldConnection = getVoiceConnection(guild.id);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch((err) => console.log(err));
            if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));

            const queue = client.queues.get(interaction.guild.id);
            if (!queue || !queue.tracks || !queue.tracks[0]) {
                return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
            }
            const song = queue.tracks[0] as IESong;
            if (!song) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err))

            const state = oldConnection.state as VoiceConnectionReadyState;
            if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));
            const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
            if (!playerState || !playerState.resource || !playerState.resource.volume) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));        
            
            const curPos = playerState.resource.playbackDuration;

            const songEmbed = new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setTitle(`${song.title}`)
                .setURL(client.getYTLink(song.id as string))
                .addFields(
                    { name: `ℹ️ **Upload-Channel:**`, value: `> ${song ? `[${song.channel?.name}](${song.channel?.url})` : `\`Unknown\``}`, inline: true },
                    { name: `📅 **Upload-At:**`, value: `> ${song.uploadedAt}`, inline: true },
                    { name: `💯 **Requester:**`, value: `> ${song.requester} \`${song.requester.tag}\``, inline: true },
                    { name: `⏳ **Duration:**`, value: `> ${client.createBar(song.duration, curPos)}\n> **${client.formatDuration(curPos)} / ${song.durationFormatted}**` },
                );
            if (song?.thumbnail?.url) songEmbed.setImage(`${song?.thumbnail?.url}`);

            return interaction.reply({ content: `ℹ️ **Nowplaying Track**`, embeds: [songEmbed] }).catch((err) => console.log(err));
        },
    }
};