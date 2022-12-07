import { Divider, Input } from "antd";
import React, { useState } from "react";
import axios from "axios";

interface testCallback {
	(err: any, status: any, data: any): any;
}

const Queue = (props: any) => {
	const [page, setPage] = useState(1);
	let maxPage = props.queue.length > 6 ? Math.ceil((props.queue.length - 1) / 5) : -1;
	if (page > maxPage + 2) setPage(maxPage + 2);
	else if (page !== 1 && props.queue.slice((page - 1) * 5 + 1, page * 5 + 1).length === 0) setPage((prev) => prev - 1);
	let j = 0;

	const [link, setLink] = useState("");

	const handleRemove = (id: number) => {
		return (event: React.MouseEvent<HTMLButtonElement>) => {
			const remove = async (callback: testCallback) => {
				await axios
					.post(
						"/api/remove",
						{ queuePos: id, user: props.user.username },
						{
							headers: { "Content-Type": "application/json" },
						}
					)
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response.status, err.response.data);
					});
			};

			if (!props.user.isAdmin) {
				props.setInfo("You need to be admin!");
				return props.setInfoboxColor("orange");
			}

			if (!props.queue || props.queue.length === 0) {
				props.setInfo("No songs to remove!");
				return props.setInfoboxColor("orange");
			}
			remove((err, status, data) => {
				if (err) {
					if (status !== 500) props.setInfo(data);
					else props.setInfo("An error occured");
					props.setInfoboxColor("red");
					return console.error(err);
				}
				props.setInfo("Removed selected song!");
				props.setInfoboxColor("green");
			});
		};
	};

	const handleskipto = (id: number) => {
		return (event: React.MouseEvent<HTMLButtonElement>) => {
			const skipto = async (callback: testCallback) => {
				await axios
					.post(
						"/api/skipto",
						{ queuePos: id, user: props.user.username },
						{
							headers: { "Content-Type": "application/json" },
						}
					)
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response.status, err.response.data);
					});
			};

			if (!props.user.isAdmin) {
				props.setInfo("You need to be admin!");
				return props.setInfoboxColor("orange");
			}

			if (!props.queue || props.queue.length === 0) {
				props.setInfo("No songs to skipi to!");
				return props.setInfoboxColor("orange");
			}
			skipto((err, status, data) => {
				if (err) {
					if (status !== 500) props.setInfo(data);
					else props.setInfo("An error occured");
					props.setInfoboxColor("red");
					return console.error(err);
				}
				props.setInfo("Skiped to selected song!");
				props.setInfoboxColor("green");
			});
		};
	};

	const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		props.setIsAdding(true);
		const addSong = async (callback: testCallback) => {
			await axios
				.post(
					"/api/play",
					{ songs: link, user: props.user.username },
					{
						headers: { "Content-Type": "application/json" },
					}
				)
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (link === "") {
			props.setIsAdding(false);
			props.setInfo("Please add a link or a song name before adding it!");
			return props.setInfoboxColor("orange");
		}
		addSong((err, status, data) => {
			props.setIsAdding(false);
			setLink("");
			console.log(data);
			if (err) {
				if (status !== 500) props.setInfo(data);
				else props.setInfo("An error occured");
				props.setInfoboxColor("red");
				return console.error(err);
			}
			props.setInfoboxColor("green");
			if (props.queue.length === 0) return props.setInfo("Added to queue!");
			props.setInfo("Added after " + props.queue[props.queue.length - 1].title);
		});
	};

	const handleAddFirst = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		props.setIsAddingFirst(true);
		console.log("add first", link);
		const AddFirst = async (callback: testCallback) => {
			await axios
				.post(
					"/api/playfirst",
					{ songs: link, user: props.user.username },
					{
						headers: { "Content-Type": "application/json" },
					}
				)
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!props.queue || props.queue.length < 2) {
			props.setIsAddingFirst(false);
			props.setInfo('Please use "Add" button! There is no current queue!');
			return props.setInfoboxColor("orange");
		}
		if (link === "") {
			props.setIsAddingFirst(false);
			props.setInfo("Please add a link or a song name before adding it!");
			return props.setInfoboxColor("orange");
		}
		AddFirst((err, status, data) => {
			setLink("");
			if (err) {
				if (status !== 500) props.setInfo(data);
				else props.setInfo("An error occured");
				props.setInfoboxColor("red");
				return console.error(err);
			}
			props.setInfo("Added after current song!");
			props.setInfoboxColor("green");
		});
	};

	const handleShuffle = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		props.setIsShuffling(true);
		const shuffleSongs = async (callback: testCallback) => {
			await axios
				.post("/api/shuffle", { user: props.user.username })
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!props.queue || props.queue.length < 3) {
			props.setIsShuffling(false);
			props.setInfo("No songs to shuffle!");
			return props.setInfoboxColor("orange");
		}
		shuffleSongs((err, status, data) => {
			if (err) {
				if (status !== 500) props.setInfo(data);
				else props.setInfo("An error occured");
				props.setInfoboxColor("red");
				return console.error(err);
			}
			props.setInfo("Shuffled queue!");
			props.setInfoboxColor("green");
		});
	};

	const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		props.setIsClearing(true);
		const clearSongs = async (callback: testCallback) => {
			await axios
				.post("/api/clearqueue", { user: props.user.username })
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!props.user.isAdmin) {
			props.setIsClearing(false);
			props.setInfo("You need to be admin!");
			return props.setInfoboxColor("orange");
		}

		if (!props.queue || props.queue.length < 2) {
			props.setIsClearing(false);
			props.setInfo("Nothing to clear!");
			return props.setInfoboxColor("orange");
		}
		clearSongs((err, status, data) => {
			if (err) {
				if (status !== 500) props.setInfo(data);
				else props.setInfo("An error occured");
				props.setInfoboxColor("red");
				return console.error(err);
			}
			props.setInfo("Cleared queue!");
			props.setInfoboxColor("green");
		});
	};

	return (
		<div className="queue">
			<div className="queue-adder">
				<Input placeholder="Song name / Link" className="queueInput" value={link} onChange={(event: any) => setLink(event.target.value)} />
				<button onClick={handleAdd} className={"next"}>{props.isAdding ? <div className="small-spinner"></div> : "ADD"}</button>
				<button onClick={handleAddFirst} className={"next"}>{props.isAddingFirst ? <div className="small-spinner"></div> : "ADD FIRST"}</button>
				<button disabled={!props.user.isAdmin} onClick={handleShuffle} className={"next"}>
					{props.isShuffling ? <div className="small-spinner"></div> : "SHUFFLE"}
				</button>
				<button disabled={!props.user.isAdmin} className="last-adder next" onClick={handleClear}>
					{props.isClearing ? <div className="small-spinner"></div> : "CLEAR"}
				</button>
			</div>
			{maxPage === -1 ? null : (
				<div className="queue-pages">
					<button onClick={() => setPage(1)}>{"|<<"}</button>
					<button onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : 1))}>{"<"}</button>
					<button onClick={() => setPage((prev) => (prev < maxPage + 1 ? prev + 1 : maxPage + 1))}>{">"}</button>
					<button className="last-adder" onClick={() => setPage(maxPage + 1)}>
						{">>|"}
					</button>
				</div>
			)}
			<div>
				page: {page} / {maxPage === -1 ? 1 : maxPage}
			</div>
			<ul>
				{props.queue.slice((page - 1) * 5 + 1, page * 5 + 1).map((track: any) => {
					j++;
					return (
						<li className="queue-item" key={"queuedSong" + String((page - 1) * 5 + j)}>
							<div className="queue-list-item">
								<div>
									<button disabled={props.checkRequester} onClick={handleRemove((page - 1) * 5 + j)}>
										remove
									</button>
									<button disabled={!props.user.isAdmin} onClick={handleskipto((page - 1) * 5 + j)}>
										skip to
									</button>
								</div>
								<div className="queue-item-name">
									<a
										href={"https://www.youtube.com/watch?v=" + track.id}
										target="_blank"
										rel="noopener noreferrer">
										{"  " + track.title}
									</a>
									<div className="requesterdiv">Requested by: {track.requester}</div>
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
