import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('remove')
            .setDescription('Removes the song!')
            .addStringOption(option =>
                option.setName('queuenumber')
                    .setDescription('Song queue number!')
                    .setRequired(true)),
        async execute(interaction) {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild;
            if (!guild) return interaction.reply("👎 **Something went wrong**").catch((err) => console.log(err));

            if (!member.voice.channelId) return interaction.reply("👎 **Please join a Voice-Channel first!**").catch((err) => console.log(err));
            
            const oldConnection = getVoiceConnection(guild.id);
            if (!oldConnection) return interaction.reply("👎 **I'm not connected somewhere!**").catch((err) => console.log(err));
            if (oldConnection && oldConnection.joinConfig.channelId != member.voice.channelId) return interaction.reply("👎 **We are not in the same Voice-Channel**!").catch((err) => console.log(err));

            const queue = client.queues.get(guild.id);
            if (!queue) {
                return interaction.reply(`👎 **Nothing playing right now**`).catch((err) => console.log(err));
            }
            
            if (!queue.tracks || queue.tracks.length <= 1) {
                return interaction.reply(`👎 **Nothing to skip**`).catch((err) => console.log(err));
            }

            const arg = interaction.options.get('queuenumber')?.value as number;

            if (!arg || isNaN(arg) || Number(arg) > queue.tracks.length) {
                return interaction.reply({ content: `👎 **There are just ${queue.tracks.length} Songs in the Queue, can't remove the ${!isNaN(arg) ? client.queuePos(Number(arg)) : arg} Song.**` });
            }

            queue.skipped = true;

            queue.tracks.splice(arg, 1);

            return interaction.reply(`⏭️ **Successfully removed the ${client.queuePos(Number(arg))} Track!**`).catch((err) => console.log(err));
        },
    }
};