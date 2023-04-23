import BotClient from "../botClient/BotClient"

export default async function getSongNameFromSpotify(client: BotClient, track: string) {
	const id = track.split("/").pop()
	const access_token = await client.getSpotifyToken()
	const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	})
	const data = await res.json()
	console.log(data)
	return { name: data.name, artists: data.artists }
}
