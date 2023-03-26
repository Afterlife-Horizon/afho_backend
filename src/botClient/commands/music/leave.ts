import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('leave')
            .setDescription('Leaves the voice channel!'),
        async execute(interaction) {
            try {
                const member = interaction.member as GuildMember;
                const guild = interaction.guild;

                if (!member || !guild) return await interaction.reply({ content: `Something went wrong` });

                const oldConnection = getVoiceConnection(guild.id);
                if (!oldConnection) return await interaction.reply({ content: `I am not in a voice channel!` });
                if (!member.voice.channelId) return await interaction.reply({ content: `Please join a voice channel first` });

                await client.leaveVoiceChannel(member.voice.channel);
                await interaction.reply({ content: `Left voice channel!` });
            }
            catch (err) {
                console.log(err);
                interaction.reply({ content: `Could not leave voice channel` });
            }
        },
    }
};