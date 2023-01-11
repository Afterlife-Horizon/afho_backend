import React, { useState } from "react";

interface Iprops {
	favs: Array<{ name: string; url: string }>;
	userId: string;
}

async function deleteFav(index: number) {
	await fetch("/api/delFavs", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ index }),
	})
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
		})
		.catch((err) => console.log(err));
}

const Favs: React.FC<Iprops> = (props) => {
	const [favAdd, setFavAdd] = useState("");

	async function addFav() {
		if (favAdd === "") return;
		await fetch("/api/addFavs", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId: props.userId, url: favAdd }),
		})
			.then((res) => res.json())
			.then((data) => {
				console.log(data);
			})
			.catch((err) => console.log(err));
	}

	if (props.userId === "") return null;
	return (
		<div>
			<h1>Favs</h1>
			<input
				type="text"
				placeholder="Add song by url"
				onChange={(e) => setFavAdd(e.target.value)}
			/>
			<button onClick={() => addFav()}>Add</button>
			{props.favs?.map((fav, index) => (
				<div>
					<h3>{fav.name}</h3>
					<button onClick={() => deleteFav(index)}>Delete</button>
				</div>
			))}
		</div>
	);
};

export default Favs;
