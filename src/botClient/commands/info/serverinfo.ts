import { SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { ICommand } from '../../../types';
import BotClient from '../../BotClient';

export default (_: BotClient) : ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Gives information about the current server!'),
        async execute(interaction) {
            const member = interaction.member as GuildMember;
            const guild = interaction.guild;

            if (!member || !guild) return interaction.reply("👎 **Something went wrong**").catch((err) => console.log(err));
            const serverinfo = new EmbedBuilder().setTitle("Server Info")
                .setDescription("Displaying information about the current server!")
                .addFields(
                    { name: "Server name", value: `${guild.name}` },
                    { name: "Total members", value: `${guild.memberCount}` },
                );

            await interaction.reply({ embeds: [serverinfo] });
        },
    }
};