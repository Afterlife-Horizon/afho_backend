import { UseQueryResult, useQuery } from "@tanstack/react-query"
import getLevels from "../utils/getLeves"

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

type userXp = { user: user; xp: number; lvl: number }[]

const useLevels = (): UseQueryResult<userXp, Error> => {
	return useQuery({
		queryKey: ["levels", "all"],
		queryFn: () => getLevels()
	})
}

export default useLevels
