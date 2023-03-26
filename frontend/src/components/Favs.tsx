// ------------ Packages ------------
import React, { useContext, useState } from "react";
import { Divider, Input } from "antd";
import { Image } from "antd";

// ------------ CSS Files ------------
import "../css/Favs.css";
import "../css/dark/Favs.css";
import MusicContext from "../context/MusicContext";


const Favs: React.FC = () => {

	const { favs, setFavs, user, setIsAdding, setInfo, setInfoboxColor, queue } = useContext(MusicContext);
	const userId = user?.id || "";
	const username = user?.username;

	const [favAdd, setFavAdd] = useState("");
	const [page, setPage] = useState(1);

	if(!favs.length) return <div></div>;

	let maxPage = favs.length > 6 ? Math.ceil((favs.length - 1) / 5) : -1;
	if (page > maxPage + 2) setPage(maxPage + 2);
	else if (
		page !== 1 &&
		favs.slice((page - 1) * 5 + 1, page * 5 + 1).length === 0
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
			body: JSON.stringify({ userId: userId, url: favAdd }),
		})
			.then((res) => res.json())
			.then((data) => {
				setFavs(data.data);
			})
			.catch((err) => console.log(err));
		setFavAdd("");
	}
	async function deleteFav(userId: string, name: string) {
		await fetch("/api/delFav", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId, name }),
		})
			.then((res) => res.json())
			.then((data) => {
				setFavs(data.data);
			})
			.catch((err) => console.log(err));
	}
	async function playFav(fav: { name: string; url: string }) {
		await fetch("/api/play", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ songs: fav.url, user: username }),
		})
			.then((res) => res.json())
			.then((data) => {
				setIsAdding(false);
				if (data.err) {
					if (data.status !== 500) setInfo(data);
					else setInfo("An error occured");
					setInfoboxColor("red");
					return console.error(data.err);
				}
				setInfoboxColor("green");
				if (!queue) return setInfo("Added to queue!");
				setInfo(
					"Added after " + queue[queue.length - 1].title
				);
			});
	}

	if (userId === "") return null;
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
				{favs.slice((page - 1) * 5, page * 5 + 1).map((fav) => {
					j++;
					return (
						<li
							className="queue-item"
							key={"favSong" + String((page - 1) * 5 + j)}
						>
							<div className="queue-list-item">
								<div>
									<button onClick={() => playFav(fav)}>PLAY</button>
									<button onClick={() => deleteFav(userId, fav.name)}>
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
