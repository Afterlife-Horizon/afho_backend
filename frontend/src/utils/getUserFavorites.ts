export default async function getUserFavorites(id: string): Promise<{favorites: fav[]}> {
    const res = await fetch("/api/getFavs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: id }),
    })

    if (res.ok) return res.json();
    throw new Error("Failed to get user");
}