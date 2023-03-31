import { UseQueryResult, useQuery } from "@tanstack/react-query"
import getUserFavorites from "../utils/getUserFavorites"
import { fav } from "../types"

const useFavorites = (id: string): UseQueryResult<fav[], Error> => {
	return useQuery({
		queryKey: ["favorites", id],
		queryFn: () => getUserFavorites(id),
		select: data => data.favorites
	})
}

export default useFavorites
