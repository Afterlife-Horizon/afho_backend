const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fsPromises = require('fs/promises');
require('dotenv').config();

const separator = `------------------------`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brasilcount')
        .setDescription('Get brasil leaderboard!'),
    async execute(interaction) {
        try {

            const filePath = path.resolve(process.env.WORKPATH, `config/movecounts.json`);
            const data = await fsPromises.readFile(filePath);
            const moveCounts = JSON.parse(data).sort(compareCount);

            const minlistnumber = Math.ceil(moveCounts.length / 5);
            const moveCountPages = [];

            for (let j = 0; j < minlistnumber; j++) {
                moveCountPages.push([]);
            }

            let i = 0;
            moveCounts.forEach(count => {
                moveCountPages[Math.trunc(i / 5)].push(count);
                i += 1;
            });

            let page = 0;

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⬅ prev')
                        .setStyle(ButtonStyle.Primary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('next ➡')
                        .setStyle(ButtonStyle.Primary),
                );
            const replyEmbed = new EmbedBuilder()
                .setColor("FUCHSIA")
                .setTitle(`💨Brasiled leaderboard!`)
                .addFields(
                    {
                        name: `Page: `,
                        value: `Brasil rank`,
                        inline: true,
                    },
                    {
                        name: `${page.toString()}`,
                        value: `Username`,
                        inline: true,
                    },
                    {
                        name: `User / page : ${5}`,
                        value: `Count`,
                        inline: true,
                    },
                );
            moveCountPages[page].forEach((count, index) => {
                replyEmbed.addFields(
                    {
                        name: separator,
                        value: (page * 10 + index + 1).toString(),
                        inline: true,
                    },
                    {
                        name: separator,
                        value: `<@${count.id}>`,
                        inline: true,
                    },
                    {
                        name: separator,
                        value: (count.counter).toString(),
                        inline: true,
                    },
                );
            });

            const reply = await interaction.reply({
                embeds: [replyEmbed],
                components: [buttons],
            });


            // ------------ Button Collectors ------------
            const nextCollector = reply.createMessageComponentCollector({
                filter: (inn => inn.customId == "next"),
                time: 120000,
            });

            nextCollector.on('collect', async ninteraction => {
                if (page !== moveCountPages.length - 1) page += 1;
                const replyEmbed2 = new EmbedBuilder()
                    .setColor("FUCHSIA")
                    .setTitle(`💨Brasiled leaderboard!`)
                    .addFields(
                        {
                            name: `Page: `,
                            value: `Brasil rank`,
                            inline: true,
                        },
                        {
                            name: `${page.toString()}`,
                            value: `Username`,
                            inline: true,
                        },
                        {
                            name: `User / page : ${5}`,
                            value: `Count`,
                            inline: true,
                        },
                    );
                moveCountPages[page].forEach((count, index) => {
                    replyEmbed2.addFields(
                        {
                            name: separator,
                            value: (page * 10 + index + 1).toString(),
                            inline: true,
                        },
                        {
                            name: separator,
                            value: `<@${count.id}>`,
                            inline: true,
                        },
                        {
                            name: separator,
                            value: (count.counter).toString(),
                            inline: true,
                        },
                    );
                });

                await ninteraction.update(
                    {
                        embeds: [replyEmbed2],
                        components: [buttons],
                    },
                );
            });

            const prevCollector = reply.createMessageComponentCollector({
                filter: (inn => inn.customId == "prev"),
                time: 120000,
            });

            prevCollector.on('collect', async ninteraction => {
                if (page !== 0) page -= 1;
                const replyEmbed2 = new EmbedBuilder()
                    .setColor("FUCHSIA")
                    .setTitle(`💨Brasiled leaderboard!`)
                    .addFields(
                        {
                            name: `Page: `,
                            value: `Brasil rank`,
                            inline: true,
                        },
                        {
                            name: `${page.toString()}`,
                            value: `Username`,
                            inline: true,
                        },
                        {
                            name: `User / page : ${5}`,
                            value: `Count`,
                            inline: true,
                        },
                    );
                moveCountPages[page].forEach((count, index) => {
                    replyEmbed2.addFields(
                        {
                            name: separator,
                            value: (page * 10 + index + 1).toString(),
                            inline: true,
                        },
                        {
                            name: separator,
                            value: `<@${count.id}>`,
                            inline: true,
                        },
                        {
                            name: separator,
                            value: (count.counter).toString(),
                            inline: true,
                        },
                    );
                });

                await ninteraction.update(
                    {
                        embeds: [replyEmbed2],
                        components: [buttons],
                    },
                );
            });

        }
        catch (err) {
            console.error(err);
            await interaction.reply({ content: `❌ An error occured!` });
        }
    },
};

function compareCount(count1, count2) {
    if (count1.counter > count2.counter) return -1;
    else if (count1.counter < count2.counter) return 1;
    return 0;
}
