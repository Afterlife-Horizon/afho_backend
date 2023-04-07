import { fav } from "../types"
import { supabase } from "./supabaseUtils"

export default async function getUserFavorites(id: string): Promise<{ favorites: fav[] }> {
	const url = "/api/getFavs"
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			access_token: (await supabase.auth.getSession())?.data.session?.access_token
		})
	})

	if (res.ok) return res.json()
	throw new Error("Failed to get user")
}
