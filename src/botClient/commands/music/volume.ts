import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { AudioPlayerPausedState, AudioPlayerPlayingState, AudioPlayerState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('volume')
            .setDescription('Set the volume!')
            .addStringOption(option =>
                option.setName('volume')
                    .setDescription('From 1 to 150!')
                    .setRequired(true)),
        async execute(interaction) {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild;

            if (!member || !guild) return interaction.reply("👎 **Something went wrong**").catch((err) => console.log(err));

            if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));

            const oldConnection = getVoiceConnection(guild.id);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
            if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));

            const queue = client.queues.get(guild.id);
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`);
            }

            const arg = interaction.options.get('volume')?.value as number;

            if (!arg || isNaN(arg) || Number(arg) < 1 || Number(arg) > 150) return interaction.reply(`👎 **No __valid__ Volume between 1 and 150 % provided!** Usage: \`/volume 25\``).catch((err) => console.log(err));
            const volume = Number(arg);
            queue.volume = volume;

            const state = oldConnection.state as VoiceConnectionReadyState;
            if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));

            const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
            if (!playerState || !playerState.resource || !playerState.resource.volume) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));        
            
            playerState.resource.volume.setVolume(volume / 100);

            return interaction.reply(`🔊 **Successfully changed the Volume to \`${volume}%\`**`).catch((err) => console.log(err));
        },
    }
};