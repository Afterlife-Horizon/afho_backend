const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admins')
        .setDescription('Lists all admins!'),
    async execute(interaction) {
        const guild = interaction.guild;
        await guild.members.fetch();
        const membersWithRole = await guild.roles.cache.find(r => r.name === "admin").members;

        console.log(membersWithRole);
        const ListEmbed = new EmbedBuilder()
            .setTitle('Users with the admin role:')
            .setDescription(membersWithRole.map(m => m.user.tag).join('\n'));
        interaction.reply({ embeds: [ListEmbed] });
    },
};