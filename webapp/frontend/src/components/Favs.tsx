// ------------ Packages ------------
import React, { useState } from "react";
import { Divider, Input } from "antd";
import { Image } from "antd";

// ------------ CSS Files ------------
import "../css/Favs.css";
import "../css/dark/Favs.css";

interface Iprops {
	setFavs: React.Dispatch<React.SetStateAction<never[]>>;
	setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
	setInfo: React.Dispatch<React.SetStateAction<string>>;
	setInfoboxColor: React.Dispatch<React.SetStateAction<string>>;
	queue: Array<any>;
	favs: Array<{ name: string; url: string; thumbnail: string }>;
	userId: string;
	username: string;
}

const Favs: React.FC<Iprops> = (props) => {
	const [favAdd, setFavAdd] = useState("");
	const [page, setPage] = useState(1);
	let maxPage =
		props.favs.length > 6 ? Math.ceil((props.favs.length - 1) / 5) : -1;
	if (page > maxPage + 2) setPage(maxPage + 2);
	else if (
		page !== 1 &&
		props.favs.slice((page - 1) * 5 + 1, page * 5 + 1).length === 0
	)
		setPage((prev) => prev - 1);
	let j = 0;

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
		setFavAdd("");
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
			<h3>Favorites</h3>
			<div className="favsAdd">
				<Input
					className="queueInput"
					type="text"
					placeholder="Search for a song or playlist (URL or Name)"
					onChange={(e) => setFavAdd(e.target.value)}
				/>
				<button onClick={() => addFav()}>ADD</button>
			</div>
			{maxPage === -1 ? null : (
				<div className="queue-pages">
					<button onClick={() => setPage(1)}>{"|<<"}</button>
					<button onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : 1))}>
						{"<"}
					</button>
					<button
						onClick={() =>
							setPage((prev) => (prev < maxPage + 1 ? prev + 1 : maxPage + 1))
						}
					>
						{">"}
					</button>
					<button className="last-adder" onClick={() => setPage(maxPage + 1)}>
						{">>|"}
					</button>
				</div>
			)}
			<div>
				page: {page} / {maxPage === -1 ? 1 : maxPage}
			</div>
			<ul className="favsList">
				{props.favs.slice((page - 1) * 5, page * 5 + 1).map((fav, index) => {
					j++;
					return (
						<li
							className="queue-item"
							key={"favSong" + String((page - 1) * 5 + j)}
						>
							<div className="queue-list-item">
								<div>
									<button onClick={() => playFav(fav)}>PLAY</button>
									<button onClick={() => deleteFav(props.userId, index)}>
										DELETE
									</button>
								</div>
								<div>
									<Image src={fav.thumbnail} width={"10rem"} />
								</div>
								<div className="queue-item-name">
									<a href={fav.url} target="_blank" rel="noopener noreferrer">
										{"  " + fav.name}
									</a>
								</div>
							</div>

							{j !== 5 ? <Divider /> : null}
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default Favs;
