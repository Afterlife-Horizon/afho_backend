import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('clearqueue')
            .setDescription('clear the queue!'),
        async execute(interaction) {
            try {
                const member = interaction.member as GuildMember;
                const guild = interaction.guild;

                if (!member || !guild) return await interaction.reply({ content: `Something went wrong` });
                if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**");

                const oldConnection = getVoiceConnection(guild.id);
                if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**");
                if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!");

                const queue = client.queues.get(guild.id);
                if (!queue) {
                    return interaction.reply(`👎 **Nothing playing right now**`);
                }

                queue.tracks = [queue.tracks[0]];


                return interaction.reply(`🪣 **Successfully cleared the Queue.**`);
            }
            catch (err) {
                console.log(err);
            }
        },
    }
};