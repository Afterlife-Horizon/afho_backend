import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply(`Pong! My ping is ${interaction.client.ws.ping}`)
            .catch((err) => console.log(err));
    },
};