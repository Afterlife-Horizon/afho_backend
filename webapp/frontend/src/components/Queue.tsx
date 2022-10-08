import { Divider, Input } from "antd";
import React, { useState } from "react";
import axios from "axios";

interface testCallback {
	(err: any, status: any, data: any): any;
}

const Queue = (props: any) => {
	const [page, setPage] = useState(1);
	let maxPage = Math.floor(props.queue.length / 5);
	if (props.queue.slice(maxPage * 5 + 1, (maxPage + 1) * 5 + 1)?.length === 0) maxPage -= 1;
	let j = 0;

	const [link, setLink] = useState("");

	const handleRemove = (id: number) => {
		return (event: React.MouseEvent<HTMLButtonElement>) => {
			const remove = async (callback: testCallback) => {
				await axios
					.post(
						"/api/remove",
						{ queuePos: id },
						{
							headers: { "Content-Type": "application/json" },
						}
					)
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response, null);
					});
			};

			remove((err, status, data) => {
				if (err) return console.error(err);
				// console.log(data);
			});
		};
	};

	const handleskipto = (id: number) => {
		return (event: React.MouseEvent<HTMLButtonElement>) => {
			const skipto = async (callback: testCallback) => {
				await axios
					.post(
						"/api/skipto",
						{ queuePos: id },
						{
							headers: { "Content-Type": "application/json" },
						}
					)
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response, null);
					});
			};

			skipto((err, status, data) => {
				if (err) return console.error(err);
				// console.log(data);
			});
		};
	};

	const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		console.log("add", link);
		const changeSongFilter = async (callback: testCallback) => {
			await axios
				.post(
					"/api/play",
					{ songs: link },
					{
						headers: { "Content-Type": "application/json" },
					}
				)
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response, null);
				});
		};

		changeSongFilter((err, status, data) => {
			setLink("");
			if (err) return console.error(err);
			// console.log(data);
		});
	};

	const handleAddFirst = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		console.log("add first", link);
	};

	const handleShuffle = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const stopSong = async (callback: testCallback) => {
			await axios
				.get("/api/shuffle")
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response, null);
				});
		};

		stopSong((err, status, data) => {
			if (err) return console.error(err);
			// console.log(data);
		});
	};

	return (
		<div className="queue">
			<div className="queue-adder">
				<Input placeholder="Song name / Link" value={link} onChange={(event: any) => setLink(event.target.value)} />
				<button onClick={handleAdd}>ADD</button>
				<button onClick={handleAddFirst}>ADD FIRST</button>
				<button onClick={handleShuffle}>SHUFFLE</button>
				<button className="last-adder" onClick={handleShuffle}>
					CLEAR
				</button>
			</div>
			<div className="queue-pages">
				<button onClick={() => setPage(1)}>{"⏮"}</button>
				<button onClick={() => setPage((prev) => (prev !== 1 ? prev - 1 : 1))}>{"⏪"}</button>
				<button onClick={() => setPage((prev) => (prev !== maxPage + 1 ? prev + 1 : maxPage + 1))}>{"⏩"}</button>
				<button className="last-adder" onClick={() => setPage(maxPage + 1)}>
					{"⏭"}
				</button>
			</div>
			<div>
				page: {page} / {maxPage + 1}
			</div>
			<ul>
				{props.queue.slice((page - 1) * 5 + 1, page * 5 + 1).map((track: any) => {
					j++;
					return (
						<li key={"queuedSong" + String((page - 1) * 5 + j)}>
							<div className="queue-list-item">
								<div>
									<button onClick={handleRemove((page - 1) * 5 + j)}>remove</button>
									<button onClick={handleskipto((page - 1) * 5 + j)}>skip to</button>
								</div>
								<div className="queue-item-name">
									<a
										href={"https://www.youtube.com/watch?v=" + track.id}
										target="_blank"
										rel="noopener noreferrer">
										{"  " + track.title}
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

export default Queue;
