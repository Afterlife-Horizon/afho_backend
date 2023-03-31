import { IFetchData } from "../types"

export default async function getBotInfo(): Promise<IFetchData> {
	const res = await fetch("/api/fetch")

	if (res.ok) return res.json()
	throw new Error("Failed to get user")
}
