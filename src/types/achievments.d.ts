export type Achievement = MessageAchievement | TimeAchievement | BrasilAchievement

export type MessageAchievement = {
	id: string
	currentTitle: MessageAchievementTitle
	type: AchievementType.MESSAGE
	messages: number
}

export type TimeAchievement = {
	id: string
	currentTitle: TimeAchievementTitle
	type: AchievementType.TIME
	time: number
}

export type BrasilAchievement = BrasilSentAchievement | BrasilReacivedAchievement

export type BrasilSentAchievement = {
	id: string
	currentTitle: BrasilSentAchievementTitle
	type: AchievementType.BrasilSent
	count: number
}

export type BrasilRecievedAchievement = {
	id: string
	currentTitle: BrasilRecievedAchievementTitle
	type: AchievementType.BrasilRecieved
	count: number
}
