import { UseQueryResult, useQuery } from "@tanstack/react-query"
import getConnectedMembers from "../utils/getConnectedMembers"

type users = {
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

const useConnectedMembers = (): UseQueryResult<users, Error> => {
	return useQuery({
		queryKey: ["connectedMembers", "all"],
		queryFn: () => getConnectedMembers(),
		refetchInterval: 2000,
		select: data => data.data
	})
}

export default useConnectedMembers
