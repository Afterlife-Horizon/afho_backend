import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('move')
            .setDescription('Moves song in queue!')
            .addStringOption(option =>
                option.setName('from')
                    .setDescription('queue number of song to move!')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('to')
                    .setDescription('queue number of song to replace')
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

            const args = [interaction.options.get("from")?.value as number, interaction.options.get("to")?.value as number];

            if (!args[0] || isNaN(args[0]) || Number(args[0]) < 1 || !args[1] || isNaN(args[1]) || Number(args[1]) < 1) {
                return interaction.reply(`👎 **From where to where shall I move?** Usage: \`/move <fromPosNr.> <toPosNr.>\``).catch((err) => console.log(err));
            }


            queue.tracks = arrayMove(queue.tracks, args[0], args[1]);

            return interaction.reply(`🪣 **Successfully moved the \`${client.queuePos(args[0])} Song\` to \`${client.queuePos(args[1])} Position\` in the Queue.**`).catch((err) => console.log(err));
        },
    }
};

function arrayMove(array, from, to) {
    try {
        array = [...array];
        const startIndex = from < 0 ? array.length + from : from;
        if (startIndex >= 0 && startIndex < array.length) {
            const endIndex = to < 0 ? array.length + to : to;
            const [item] = array.splice(from, 1);
            array.splice(endIndex, 0, item);
        }
        return array;
    }
    catch (err) {
        console.log(err);
    }
}