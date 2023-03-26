import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { VoiceConnectionReadyState, getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('skip')
            .setDescription('skips the song!'),
        async execute(interaction) {
            try {
                const guild = interaction.guild;
                const member = interaction.member as GuildMember;
                if (!guild) return interaction.reply("👎 **Something went wrong**");
                if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");
                
                const oldConnection = getVoiceConnection(guild.id);

                if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
                if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!");

                const queue = client.queues.get(guild.id);
                if (!queue) {
                    return interaction.reply(`👎 **Nothing playing right now**`);
                }
                // no new songs (and no current)
                if (!queue.tracks || queue.tracks.length <= 1) {
                    return interaction.reply(`👎 **Nothing to skip**`);
                }
                queue.skipped = true;
                
                const state = oldConnection.state as VoiceConnectionReadyState;
                if (!state || !state.subscription) return interaction.reply(`👎 **Something went wrong**`).catch((err) => console.log(err));
            
                // state.subscription.player.stop();

                return interaction.reply(`⏭️ **Successfully skipped the Track**`);
            }
            catch (err) {
                console.log(err);
            }
        },
    }
};