import BotClient from "../botClient/BotClient"

export default async function getPlaylistInfoFromSpotify(client: BotClient, playlist: string) {
	const id = playlist.split("/").pop()
	const access_token = await client.getSpotifyToken()
	const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	})
	const data = await res.json()
	return { name: data.name, items: data.tracks.items }
}
