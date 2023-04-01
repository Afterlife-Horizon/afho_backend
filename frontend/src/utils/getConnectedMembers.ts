type DATA = {
	id: string
	bot: boolean
	system: boolean
	flags: number
	username: string
	discriminator: string
	avatar: string
	createdTimestamp: number
	defaultAvatarURL: string
	tag: string
	avatarURL: string
	displayAvatarURL: string
}[]

export default async function getConnectionmembers(): Promise<{ data: DATA }> {
	const res = await fetch("/api/connectedMembers")

	if (res.ok) return res.json()
	throw new Error("Something went wrong")
}
