import { GuildMember } from "discord.js"

export enum AchievementType {
	MESSAGE = "MESSAGE",
	TIME = "TIME",
	BrasilRecieved = "BrasilRecieved",
	BrasilSent = "BrasilSent"
}

export enum MessageAchievementTitle {
	FIRST = "Il est bavard celui-là",
	SECOND = "Pilier de Bar",
	THIRD = "Auteur",
	FOURTH = "Killian"
}

export enum TimeAchievementTitle {
	FIRST = "Et un jour de perdu!",
	SECOND = "Code du travail",
	THIRD = "Mi-Temps",
	FOURTH = "Intermittent du spectacle",
	FIFTH = "Allocataire du RSA",
	SIXTH = "Nico"
}

export enum BrasilRecievedAchievementTitle {
	FIRST = "Découverte du pays",
	SECOND = "Voyageur",
	THIRD = "Visa Touristique",
	FOURTH = "Bresilien",
	FIFTH = "Isekaied"
}

export enum BrasilSentAchievementTitle {
	FIRST = "Gout du pouvoir",
	SECOND = "Vote a droite",
	THIRD = "Cartel des Favelas",
	FOURTH = "Bolsonaro",
	FIFTH = "Truck-kun"
}

export type AchievementTitle = MessageAchievementTitle | TimeAchievementTitle | BrasilSentAchievementTitle | BrasilRecievedAchievementTitle

export type Achievement = {
	user: GuildMember
	currentTitle: AchievementTitle
	type: AchievementType
}
