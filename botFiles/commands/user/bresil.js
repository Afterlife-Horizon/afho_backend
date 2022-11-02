const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bresil')
        .setDescription('Move member to bresil!')
        .addStringOption(option =>
            option.setName('member')
                .setDescription('member you want to move!')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const brasilChannelId = "949759752852877352";
            const voiceChannel = interaction.member.voice;
            const messageMember = interaction.options.getString('member');
            const memberid = messageMember.replace(/\D/g, '');
            if (!voiceChannel) await interaction.reply({ content: `❌ You are not in a channel you wanker!` });


            const guild = interaction.client.guilds.cache.find(g => g.name === "Afterlife Horizon");
            const member = await guild.members.fetch(memberid);
            if (!member) await interaction.reply({ content: `❌ Member is not in a channel!` });


            const filePath = path.resolve(process.env.WORKPATH, `config/movecounts.json`);
            const data = await fsPromises.readFile(filePath);
            const moveCounts = JSON.parse(data);
            let moveCount = moveCounts.filter(m => m.id === member.user.id)[0]?.counter;

            if (!moveCount) {
                fs.writeFile(filePath, JSON.stringify([...moveCounts, { id: member.user.id.toString(), username: member.user.username, counter: 1 }]), 'utf8', (err) => {
                    if (err) {
                        console.log("An error occured while writing JSON Object to File.");
                        return console.log(err);
                    }

                    console.log("JSON file has been saved.");
                });
            }
            else {
                moveCount += 1;
                const index = moveCounts.findIndex(m => m.username === member.user.username);
                moveCounts[index] = { id: member.user.id.toString(), username: member.user.username, counter: moveCount };
                fs.writeFile(filePath, JSON.stringify([...moveCounts]), 'utf8', (err) => {
                    if (err) {
                        console.log("An error occured while writing JSON Object to File.");
                        return console.log(err);
                    }
                });
            }

            const brasilChannel = interaction.client.channels.cache.get(brasilChannelId);
            await member.voice.setChannel(brasilChannel);

            const replyEmbed = new EmbedBuilder()
                .setColor("Fuchsia")
                .setTitle(`💨Brasiled`)
                .addFields(
                    {
                        name: `Mover`,
                        value: `${interaction.user.username}`,
                        inline: false,
                    },
                    {
                        name: `Moved`,
                        value: `${messageMember} to <#${brasilChannelId}> !`,
                        inline: false,
                    },
                    {
                        name: `Move count`,
                        value: `${moveCount ? moveCount : 1}`,
                        inline: false,
                    },
                );

            await interaction.reply({ embeds: [replyEmbed] });

        }
        catch (err) {
            console.error(err);
            await interaction.reply({ content: `❌ An error occured!` });
        }
    },
};

