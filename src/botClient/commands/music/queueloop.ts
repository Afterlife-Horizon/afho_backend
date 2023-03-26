import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from "@discordjs/voice";
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (client: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('queueloop')
            .setDescription('Toggles the Queue-Loop!'),
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
            if (queue.trackloop) queue.trackloop = false;

            queue.queueloop = !queue.queueloop;

            return interaction.reply(`🔂 **Queue-Loop is now \`${queue.queueloop ? "Enabled" : "Disabled"}\`**`).catch((err) => console.log(err));
        },
    }
};