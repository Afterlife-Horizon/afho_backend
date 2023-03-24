type tokens = {
    access_token: string,
    token_type: string,
}

export default async function getUser(code: string) : Promise<tokens> {
    const res = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
    })
    if (res.ok) return res.json();
    throw new Error("Failed to get user");
};