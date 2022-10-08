// ------------ Packages ------------
import { Card, Avatar } from "antd";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

// ------------ CSS Files ------------
import "../css/Music.css";
import "antd/dist/antd.css";

// ------------ Components ------------
import Queue from "./Queue";
import Filters from "./Filters";
const { Meta } = Card;
const _ = require("lodash");

interface testCallback {
	(err: any, status: any, data: any): any;
}

const Music = (props: any) => {
	const [user, setUser] = useState({
		accent_color: 14172358,
		avatar: "",
		avatar_decoration: null,
		banner: "",
		banner_color: "",
		discriminator: "",
		flags: 128,
		id: "",
		locale: "",
		mfa_enabled: true,
		premium_type: 2,
		public_flags: 128,
		username: "",
	});
	const [searchParams] = useSearchParams();
	window.onload = () => {
		const code = searchParams.get("code");

		const access_token = sessionStorage.getItem("access_token");

		if ((!code || code === "") && !sessionStorage.getItem("access_token")) return window.location.replace("/login");
		if (!access_token) {
			const getUser = async (callback: testCallback) => {
				await axios
					.post(
						"/api/login",
						{ code: code },
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

			getUser((err, status, data) => {
				if (err) return console.error(err);
				else if (status !== 200) return;
				sessionStorage.setItem("access_token", data.access_token);
				sessionStorage.setItem("token_type", data.token_type);
				// setTimeout(() => {
				// 	window.location.replace("/");
				// }, 500);
			});
		} else {
			const getUser = async (callback: testCallback) => {
				await axios
					.post(
						"/api/loginaccess",
						{
							access_token: sessionStorage.getItem("access_token"),
							token_type: sessionStorage.getItem("token_type"),
						},
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

			getUser((err, status, data) => {
				if (err) return console.error(err);
				else if (status !== 200) return;
				setUser(data);
			});
		}
	};

	const classes = "music " + props.className;

	const [nextClicked, setNextClicked] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [queue, setQueue]: any[] = useState([]);
	const [songProgress, setSongProgress] = useState(0);
	const [hasChanged, setHasChanged] = useState(true);

	const [song, setSong] = useState({
		name: "None",
		artist: "",
		requester: "None",
		filters: {
			bassboost: 0,
			subboost: false,
			mcompand: false,
			haas: false,
			gate: false,
			karaoke: false,
			flanger: false,
			pulsator: false,
			surrounding: false,
			"3d": false,
			vaporwave: false,
			nightcore: false,
			phaser: false,
			normalizer: false,
			speed: 1,
			tremolo: false,
			vibrato: false,
			reverse: false,
			treble: false,
		},
		url: "",
		formatedprog: "00:00",
		duration: "00:00",
		cover_src: "https://freesvg.org/img/aiga_waiting_room_bg.png",
	});

	const [intervalReset, setIntervalReset] = useState(false);
	useEffect(() => {
		const repeatedFetchInterval = setInterval(() => {
			if (searchParams.get("code")) window.location.replace("/");
			const getQueue = async (callback: testCallback) => {
				await axios
					.get("/api/fetchqueue")
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response, null);
					});
			};

			getQueue((err, status, data) => {
				if (err) return console.error(err);
				const queue = data.queue[0];
				// console.log(queue);
				if (queue && queue?.tracks[0]) {
					setSong({
						name: queue.tracks[0].title,
						artist: queue.tracks[0].channel.name,
						filters: queue.effects,
						requester: queue.tracks[0].requester,
						url: "https://www.youtube.com/watch?v=" + queue.tracks[0].id,
						formatedprog: data.formatedprog,
						duration: queue.tracks[0].durationFormatted,
						cover_src: queue.tracks[0].thumbnail.url,
					});
					setIsPaused(queue.paused);
					setQueue(queue.tracks.slice(0));
					setSongProgress(Math.floor(100 * (data.prog / queue.tracks[0].duration)));
					setHasChanged(queue.filtersChanged);
				} else {
					setHasChanged(false);
					setSong({
						name: "None",
						artist: "",
						requester: "None",
						filters: {
							bassboost: 0,
							subboost: false,
							mcompand: false,
							haas: false,
							gate: false,
							karaoke: false,
							flanger: false,
							pulsator: false,
							surrounding: false,
							"3d": false,
							vaporwave: false,
							nightcore: false,
							phaser: false,
							normalizer: false,
							speed: 1,
							tremolo: false,
							vibrato: false,
							reverse: false,
							treble: false,
						},
						url: "",
						formatedprog: "00:00",
						duration: "00:00",
						cover_src: "https://freesvg.org/img/aiga_waiting_room_bg.png",
					});
					setQueue([]);
				}
				setIntervalReset((prev) => !prev);
			});
		}, 1000);

		return () => {
			clearInterval(repeatedFetchInterval);
		};
	}, [intervalReset]);

	const handleNextClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		const skipSong = async (callback: testCallback) => {
			await axios
				.get("/api/skip")
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response, null);
				});
		};

		skipSong((err, status, data) => {
			if (err) return console.error(err);
			// console.log(data);
		});

		if (nextClicked) setNextClicked(false);
		else setNextClicked(true);
	};

	const handlePauseClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const pauseSong = async (callback: testCallback) => {
			await axios
				.get("/api/pause")
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response, null);
				});
		};
		const unPauseSong = async (callback: testCallback) => {
			await axios
				.get("/api/unpause")
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response, null);
				});
		};

		if (isPaused) {
			unPauseSong((err, status, data) => {
				if (err) return console.error(err);
				// console.log(data);
			});
		} else {
			pauseSong((err, status, data) => {
				if (err) return console.error(err);
				// console.log(data);
			});
		}
	};

	const handleStopClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const stopSong = async (callback: testCallback) => {
			await axios
				.get("/api/stop")
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

	const handleLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		sessionStorage.removeItem("access_token");
		sessionStorage.removeItem("token_type");
		window.location.replace("/login");
	};

	return (
		<div className={classes}>
			<div className="nowplaying">
				<Card
					className="nowplaying-card"
					cover={<img className="nowplaying-img" alt="example" src={song.cover_src} />}
					actions={[
						<button className="next" onClick={handleStopClicked}>
							STOP
						</button>,
						<button className="next" onClick={handlePauseClicked}>
							{isPaused ? "UNPAUSE" : "PAUSE"}
						</button>,
						<button className="next" onClick={handleNextClicked}>
							NEXT
						</button>,
					]}>
					<Meta
						title={
							<a href={song.url} target="_blank" rel="noopener noreferrer">
								{song.name}
							</a>
						}
						description={
							<div>
								<div>{song.artist}</div>
								<progress id="sgprog" max="100" value={songProgress}>
									{songProgress + "%"}
								</progress>
								<div>
									{song.formatedprog} / {song.duration}
								</div>
								<div>Requester: {song.requester}</div>
							</div>
						}
					/>
				</Card>
				<Card className="nowplaying-card">
					<Meta
						avatar={<Avatar src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} />}
						title={`${user.username}#${user.discriminator}`}
					/>
				</Card>
				<div className="nowplaying-card ant-card">
					<button onClick={handleLogout}>LOG OUT</button>
				</div>
			</div>
			<Queue song={song} queue={queue} user={user} />
			<Filters hasChanged={hasChanged} filters={song.filters} />
		</div>
	);
};

export default Music;
