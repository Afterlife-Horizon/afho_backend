import { UseQueryResult, useQuery } from "@tanstack/react-query"
import { IFetchData } from "../types"
import getBotInfo from "../utils/getBotinfo"

const useFetchInfo = (): UseQueryResult<IFetchData, Error> => {
	return useQuery({
		queryKey: ["fetchInfo"],
		queryFn: getBotInfo,
		refetchInterval: 1000
	})
}

export default useFetchInfo
