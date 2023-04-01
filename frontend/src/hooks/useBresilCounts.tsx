import { UseQueryResult, useQuery } from "@tanstack/react-query"
import getLevels from "../utils/getLeves"
import getBresilCounts from "../utils/getBresilCounts"

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

const useBresilCounts = (): UseQueryResult<COUNTS, Error> => {
	return useQuery({
		queryKey: ["bresil", "all"],
		queryFn: () => getBresilCounts(),
		refetchInterval: 2000
	})
}

export default useBresilCounts
