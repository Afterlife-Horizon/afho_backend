import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ApplicationCommand } from 'discord.js';
import { ICommand } from '../../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admins')
        .setDescription('Lists all admins!'),
    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        await guild.members.fetch();

        const membersWithRole = guild.roles.cache.find(r => r.name === "admin")?.members;

        const ListEmbed = new EmbedBuilder()
            .setTitle('Users with the admin role:')
            .setDescription(membersWithRole ? membersWithRole.map(m => m.user.tag).join('\n') : 'No admins found!');
        interaction.reply({ embeds: [ListEmbed] });
    },
} as ICommand;