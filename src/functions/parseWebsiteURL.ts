export default function parseWebsiteURL(url?: string): string {
	if (!url) return ""
	if (url.endsWith("/")) url = url.slice(0, -1)
	if (url.startsWith("http://") || url.startsWith("https://")) return url

	return `http://${url}`
}
