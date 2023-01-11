import React, { useState } from "react";
import "../css/Favs.css";

interface Iprops {
	setFavs: React.Dispatch<React.SetStateAction<never[]>>;
	favs: Array<{ name: string; url: string }>;
	userId: string;
}

async function deleteFav(index: number) {
	await fetch("/api/delFav", {
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

async function playFav(fav: { name: string; url: string }) {
	return;
}

const Favs: React.FC<Iprops> = (props) => {
	const [favAdd, setFavAdd] = useState("");

	async function addFav() {
		if (favAdd === "") return;
		await fetch("/api/addFav", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId: props.userId, url: favAdd }),
		})
			.then((res) => res.json())
			.then((data) => {
				props.setFavs(data.data.data.favs);
			})
			.catch((err) => console.log(err));
	}

	if (props.userId === "") return null;
	return (
		<div className="favs">
			<h2>Favs</h2>
			<div className="favsAdd">
				<input
					type="text"
					placeholder="Add song by url"
					onChange={(e) => setFavAdd(e.target.value)}
				/>
				<button onClick={() => addFav()}>ADD</button>
			</div>
			<div className="favsList">
				{props.favs?.map((fav, index) => (
					<div className="">
						<p>{fav.name}</p>
						<button onClick={() => playFav(fav)}>PLAY</button>
						<button onClick={() => deleteFav(index)}>DELETE</button>
					</div>
				))}
			</div>
		</div>
	);
};

export default Favs;
