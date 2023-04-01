type COUNTS = { user: user; bresil_received: number; bresil_sent: number }[]

type user = {
	guildId: string
	joinedTimestamp: number
	premiumSinceTimestamp: number | null
	nickname: null | string
	pending: boolean
	communicationDisabledUntilTimestamp: number | null
	userId: string
	avatar: string | null
	displayName: string
	roles: string[]
	avatarURL: string | null
	displayAvatarURL: string
}

export default async function getBresilCounts(): Promise<COUNTS> {
	const res = await fetch("/api/brasilBoard")

	if (res.ok) return res.json()
	throw new Error("Something went wrong")
}
