import { IFetchData } from "../types"

export default async function getBotInfo(): Promise<IFetchData> {
	const url = "/api/fetch"
	const res = await fetch(url)

	if (res.ok) return res.json()
	throw new Error("Failed to get user")
}
