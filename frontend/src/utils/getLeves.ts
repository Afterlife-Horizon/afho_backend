export default async function getLevels() {
	const res = await fetch("/api/levels")

	if (res.ok) return res.json()

	throw new Error("Something went wrong")
}
