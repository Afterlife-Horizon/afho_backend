import { apiUser } from "../types"

export default async function getUser(access_token: string, token_type: string): Promise<apiUser> {
	const url = "/api/loginaccess"

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			access_token: access_token,
			token_type: token_type
		})
	})
	if (res.ok) return res.json()
	throw new Error("Failed to get user")
}
