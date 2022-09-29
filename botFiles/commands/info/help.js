const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Gives a list of my commands!'),
    async execute(interaction) {
        console.log(interaction.client.commands);
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor("FUCHSIA")
                .setTitle(`👍 **Here is a list of all of my Commands**`)
                .addFields(interaction.client.commands.map(command => {
                    return {
                        name: `/${command.data.name}`,
                        value: `> *${command.data.description}*`,
                        inline: false,
                    };
                })),
            ],
        }).catch(() => null);
    },
};