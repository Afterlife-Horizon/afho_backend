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
		isAdmin: false,
	});
	const [colorScheme, setColorScheme] = useState("light");
	const [searchParams] = useSearchParams();
	useEffect(() => {
		const code = searchParams.get("code");

		const access_token = localStorage.getItem("access_token");

		if ((!code || code === "") && !access_token) return window.location.replace("/login");
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
						callback(err, err.response.status, err.response.data);
					});
			};

			getUser((err, status, data) => {
				if (err) return console.error(err);
				else if (status !== 200) return;
				localStorage.setItem("access_token", data.access_token);
				localStorage.setItem("token_type", data.token_type);
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
							access_token: localStorage.getItem("access_token"),
							token_type: localStorage.getItem("token_type"),
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
						callback(err, err.response.status, err.response.data);
					});
			};

			getUser((err, status, data) => {
				if (err) {
					return setInfo("A probleme occured!");
				} else if (status !== 200) {
					setInfo("A probleme occured!");
					localStorage.clear();
					return window.location.replace("/login");
				} else if (status === 200 && !data.username) {
					setInfo("A probleme occured!");
					localStorage.clear();
					return window.location.replace("/login");
				}
				setInfo("Logged in!");
				setUser({ ...data, isAdmin: false });
			});
		}
	}, []);

	const classes = "music " + props.className + " " + colorScheme;

	const [info, setInfo] = useState("");
	const [infoboxColor, setInfoboxColor] = useState("white");
	const [nextClicked, setNextClicked] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [queue, setQueue]: any[] = useState([]);
	const [songProgress, setSongProgress] = useState(0);
	const [hasChanged, setHasChanged] = useState(true);
	const [isSongRequester, setIsRequester] = useState(true);

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
			const fetchInfo = async (callback: testCallback) => {
				await axios
					.get("/api/fetch")
					.then((res) => {
						// console.log(res);
						callback(null, res.status, res.data);
					})
					.catch((err) => {
						callback(err, err.response.status, err.response.data);
					});
			};

			fetchInfo((err, status, data) => {
				if (err) return console.error(err);
				const queue = data.queue[0];
				let tmpIsRequester = false;
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
					tmpIsRequester = user.username === queue.tracks[0].requester;
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
				const isAdmin = data.admins.usernames.includes(user.username);
				setUser((prev) => ({ ...prev, isAdmin: isAdmin }));
				setIsRequester(tmpIsRequester);
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
				.post("/api/skip", { user: user.username })
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!queue || queue.length < 2) {
			setInfo("No song to skip to!");
			return setInfoboxColor("orange");
		}
		skipSong((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data);
				else setInfo("An error occured");
				setInfoboxColor("red");
				return console.error(err);
			}
			setInfo("Skipped!");
			setInfoboxColor("green");
		});

		if (nextClicked) setNextClicked(false);
		else setNextClicked(true);
	};

	const handlePauseClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const pauseSong = async (callback: testCallback) => {
			await axios
				.post("/api/pause", { user: user.username })
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};
		const unPauseSong = async (callback: testCallback) => {
			await axios
				.post("/api/unpause", { user: user.username })
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!queue || queue.length < 1) {
			setInfo("No song playing!");
			return setInfoboxColor("orange");
		}

		if (isPaused) {
			unPauseSong((err, status, data) => {
				if (err) {
					if (status !== 500) setInfo(data);
					else setInfo("An error occured");
					setInfoboxColor("red");
					return console.error(err);
				}
				setInfo("Resumed!");
			});
		} else {
			pauseSong((err, status, data) => {
				if (err) {
					if (status !== 500) setInfo(data);
					else setInfo("An error occured");
					setInfoboxColor("red");
					return console.error(err);
				}
				setInfo("Paused!");
				setInfoboxColor("green");
			});
		}
	};

	const handleStopClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const stopSong = async (callback: testCallback) => {
			await axios
				.post("/api/stop", { user: user.username })
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!user.isAdmin) {
			setInfo("You need to be admin!");
			return setInfoboxColor("orange");
		}

		if (!queue || queue.length < 1) {
			setInfo("No song playing!");
			return setInfoboxColor("orange");
		}

		stopSong((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data);
				else setInfo("An error occured");
				setInfoboxColor("red");
				return console.error(err);
			}
			setInfo("Stopped playing!");
			setInfoboxColor("green");
		});
	};

	const handleDisconnectClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const disconnectBot = async (callback: testCallback) => {
			await axios
				.get("/api/disconnect")
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!user.isAdmin) {
			setInfo("You need to be admin!");
			return setInfoboxColor("orange");
		}

		disconnectBot((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data);
				else setInfo("An error occured");
				setInfoboxColor("red");
				return console.error(err);
			}
			setInfo("Disconnected the bot!");
			setInfoboxColor("green");
		});
	};

	const handleLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		try {
			localStorage.removeItem("access_token");
			localStorage.removeItem("token_type");
			setInfo("Logged out!");
			setInfoboxColor("green");
			setTimeout(() => {
				window.location.replace("/login");
			}, 1000);
		} catch (err) {
			setInfo("A problem occured");
			setInfoboxColor("red");
		}
	};

	let checkRequester = !user.isAdmin && !isSongRequester;
	return (
		<div className={classes}>
			<div className="nowplaying">
				<div className="nowplaying-card ant-card brasilboardd">
					<a href={"/brasilboard"}>Go to BrasilBoard!</a>
					<button onClick={() => setColorScheme(prev => prev === "light" ? "dark" : "light")}>set color</button>
				</div>
				<Card
					className="nowplaying-card"
					cover={<img className="nowplaying-img" alt="example" src={song.cover_src} />}
					actions={[
						<button disabled={!user.isAdmin} className="next" onClick={handleDisconnectClicked}>
							DISCONNECT
						</button>,
						<button disabled={!user.isAdmin} className="next" onClick={handleStopClicked}>
							STOP
						</button>,
						<button disabled={checkRequester} className="next" onClick={handlePauseClicked}>
							{isPaused ? "UNPAUSE" : "PAUSE"}
						</button>,
						<button disabled={checkRequester} className="next" onClick={handleNextClicked}>
							SKIP
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
					<Meta avatar={<Avatar src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} />} title={`${user.username}#${user.discriminator}`} />
				</Card>
				<div className="nowplaying-card ant-card">
					<button onClick={handleLogout}>LOG OUT</button>
				</div>
				<div style={{ border: `1px solid ${infoboxColor}` }} className="nowplaying-card ant-card infobox">
					{info}
				</div>
			</div>
			<Queue song={song} queue={queue} user={user} setInfo={setInfo} setInfoboxColor={setInfoboxColor} isSongRequester={checkRequester} />
			<Filters filters={song.filters} hasChanged={hasChanged} user={user} setInfo={setInfo} setInfoboxColor={setInfoboxColor} />
		</div>
	);
};

export default Music;
