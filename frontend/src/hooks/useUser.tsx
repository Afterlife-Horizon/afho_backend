import { UseQueryResult, useQuery } from "@tanstack/react-query"
import { getUser } from "../utils/supabaseUtils"
import { User } from "@supabase/supabase-js"

const useUser = (): UseQueryResult<User, Error> => {
	return useQuery({
		queryKey: ["user"],
		queryFn: getUser,
		select: data => data.user
	})
}

export default useUser
