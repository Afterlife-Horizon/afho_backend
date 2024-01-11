import { SlashCommandBuilder } from "discord.js"
import type { ICommand } from "#/types"
import type BotClient from "#/botClient/BotClient"

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

export default (client: BotClient): ICommand => {
    return {
        data: new SlashCommandBuilder()
            .setName("pfc")
            .setDescription("Pierre, feuille, Ciseaux!")
            .addStringOption(option =>
                option
                    .setName("choice")
                    .setDescription("choose from pierre, feuille and ciseaux")
                    .setRequired(true)
                    .addChoices({ name: "Pierre", value: "Pierre" }, { name: "Feuille", value: "Feuille" }, { name: "Ciseaux", value: "Ciseaux" })
            ),
        async execute(interaction) {
            const res = [1, 10, 30][getRndInteger(0, 3)]

            let userChoice = -1
            switch (interaction.options.get("choice")?.value as string) {
                case "Pierre":
                    userChoice = 1
                    break
                case "Feuille":
                    userChoice = 10
                    break
                case "Ciseaux":
                    userChoice = 30
                    break
            }
            let response = ""
            switch (userChoice - res) {
                case 29:
                    // Ciseaux contre Pierre
                    response = "Tu as perdu! (Ciseaux(toi) contre Pierre)"
                    break
                case 20:
                    // Ciseaux contre feuille
                    response = "Tu as gagner! (Ciseaux(toi) contre Feuille)"
                    break
                case 9:
                    // Feuille contre Pierre
                    response = "Tu as gagner! (Feuille(toi) contre Pierre)"
                    break
                case 0:
                    // Cas d'egalite
                    response = "Personne ne gagne"
                    break
                case -9:
                    // Pierre contre Feuille
                    response = "Tu as perdu! (Pierre(toi) contre Feuille)"
                    break
                case -20:
                    // Feuille contre Ciseaux
                    response = "Tu as perdu! (Feuille(toi) contre Ciseaux)"
                    break
                case -29:
                    // Pierre contre Ciseaux
                    response = "Tu as gagner! (Pierre(toi) contre Ciseaux)"
                    break
            }

            await interaction.reply(response)
        }
    }
}
