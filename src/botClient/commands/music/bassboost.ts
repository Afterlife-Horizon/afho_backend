import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { AudioPlayerPausedState, AudioPlayerPlayingState, VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('bassboost')
            .setDescription('Set the bass boosting!')
            .addStringOption(option =>
                option.setName('db')
                    .setDescription('From -20 to +20!')
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
            const arg = interaction.options.get('db')?.value as number;
            if (arg === undefined || isNaN(arg) || Number(arg) < 0 || Number(arg) > 20) return interaction.reply(`👎 **No __valid__ Bassboost-Level between 0 and 20 db provided!** Usage: \`/bassboost 6\``).catch((err) => console.log(err));
            const bassboost = Number(arg);
            queue.effects.bassboost = bassboost;

            const state = oldConnection.state as VoiceConnectionReadyState;
            if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));

            const playerState = state.subscription.player.state as AudioPlayerPlayingState | AudioPlayerPausedState;
            if (!playerState || !playerState.resource || !playerState.resource.volume) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));        
            
            
            queue.filtersChanged = true;
            const curPos = playerState.resource.playbackDuration;
            state.subscription.player.stop();
            state.subscription.player.play(client.getResource(queue, queue.tracks[0].id, curPos));

            return interaction.reply(`🎚 **Successfully changed the Bassboost-Level to \`${bassboost}db\`**`).catch((err) => console.log(err));
        },
    }
};