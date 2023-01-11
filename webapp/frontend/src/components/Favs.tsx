import React, { useState } from "react";
import "../css/Favs.css";

interface Iprops {
	setFavs: React.Dispatch<React.SetStateAction<never[]>>;
	setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
	setInfo: React.Dispatch<React.SetStateAction<string>>;
	setInfoboxColor: React.Dispatch<React.SetStateAction<string>>;
	queue: Array<any>;
	favs: Array<{ name: string; url: string }>;
	userId: string;
	username: string;
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
				props.setFavs(data.data);
			})
			.catch((err) => console.log(err));
	}
	async function deleteFav(userId: string, index: number) {
		await fetch("/api/delFav", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId, index }),
		})
			.then((res) => res.json())
			.then((data) => {
				props.setFavs(data.data);
			})
			.catch((err) => console.log(err));
	}
	async function playFav(fav: { name: string; url: string }) {
		await fetch("/api/play", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ songs: fav.url, user: props.username }),
		})
			.then((res) => res.json())
			.then((data) => {
				props.setIsAdding(false);
				if (data.err) {
					if (data.status !== 500) props.setInfo(data);
					else props.setInfo("An error occured");
					props.setInfoboxColor("red");
					return console.error(data.err);
				}
				props.setInfoboxColor("green");
				if (props.queue.length === 0) return props.setInfo("Added to queue!");
				props.setInfo(
					"Added after " + props.queue[props.queue.length - 1].title
				);
			});
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
						<button onClick={() => deleteFav(props.userId, index)}>
							DELETE
						</button>
					</div>
				))}
			</div>
		</div>
	);
};

export default Favs;
