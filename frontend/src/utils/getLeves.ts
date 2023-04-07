export default async function getLevels() {
	const url = "/api/levels"
	const res = await fetch(url)

	if (res.ok) return res.json()

	throw new Error("Something went wrong")
}
