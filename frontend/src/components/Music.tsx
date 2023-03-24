// ------------ Packages ------------
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import MusicContext from "../context/MusicContext";

// ------------ Components ------------
import Queue from "./Queue";
import Filters from "./Filters";
import Favs from "./Favs";

// ------------ CSS Files ------------
import "antd/dist/antd.css";
import "../css/Music.css";
import "../css/dark/Music.css";
import NowplayingCard from "./NowplayingCard";
import axios from "axios";

interface testCallback {
	(err: any, status: any, data: any): any;
}

async function fetchInfo(callback: testCallback) {
	await axios
		.get("/api/fetch")
		.then((res) => {
			// console.log(res);
			callback(null, res.status, res.data);
		})
		.catch((err) => {
			callback(err, err.response.status, err.response.data);
		});
}

const Music = (props: any) => {
	const [searchParams] = useSearchParams();
	const isDarkTheme = window.matchMedia("(prefers-color-scheme:dark)").matches;
	
	const [user, setUser] = useState<user>({
		id: "",
		username: "",
		accent_color: "",
		avatar: "",
		avatar_decoration: "",
		banner: "",
		banner_color: "",
		discriminator: "",
		flags: 0,
		locale: "",
		mfa_enabled: false,
		premium_type: 0,
		public_flags: 0,
		isAdmin: false,
	});
	const [favs, setFavs] = useState<favs>([]);
	const [colorScheme, setColorScheme] = useState<string>("");
	const classes = "music " + props.className + " " + colorScheme;

	const [info, setInfo] = useState<string>("");
	const [infoboxColor, setInfoboxColor] = useState<string>("white");
	const [isPaused, setIsPaused] = useState<boolean>(false);
	const [queue, setQueue]: any[] = useState<track[]>([]);
	const [songProgress, setSongProgress] = useState<number>(0);
	const [hasChanged, setHasChanged] = useState<boolean>(true);
	const [isSongRequester, setIsRequester] = useState<boolean>(true);

	const [isSkipping, setIsSkipping] = useState<boolean>(false);
	const [isAdding, setIsAdding] = useState<boolean>(false);
	const [isAddingFirst, setIsAddingFirst] = useState<boolean>(false);
	const [isShuffling, setIsShuffling] = useState<boolean>(false);
	const [isClearing, setIsClearing] = useState<boolean>(false);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [intervalReset, setIntervalReset] = useState<boolean>(false);

	const [song, setSong] = useState<song>({
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

	useEffect(() => {
		setLoading(true);
		const code = searchParams.get("code");

		const access_token = localStorage.getItem("access_token");

		if ((!code || code === "") && !access_token)
			return window.location.replace("/login");
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

			fetchInfo((err, status, data) => {
				setLoading(false);
				if (err) return console.error(err);
				const queue = data.queue[0];
				let tmpIsRequester = false;
				if (queue && queue.tracks[0]) {
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
					setSongProgress(
						Math.floor(100 * (data.prog / queue.tracks[0].duration))
					);
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
				const isAdmin: boolean = data.admins.usernames.includes(user.username);
				setUser((prev) => ({ ...prev, isAdmin: isAdmin }));
				setIsRequester(tmpIsRequester);
			});
		}
	}, []);

	useEffect(() => {
		const repeatedFetchInterval = setInterval(() => {
			if (searchParams.get("code")) window.location.replace("/");

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
					setSongProgress(
						Math.floor(100 * (data.prog / queue.tracks[0].duration))
					);
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
				setIsClearing(false);
				setIsSkipping(false);
				setIsAddingFirst(false);
				setIsShuffling(false);
			});
		}, 1000);

		return () => {
			clearInterval(repeatedFetchInterval);
		};
	}, [intervalReset]);

	useEffect(() => {
		async function fetchUserfavs() {
			await axios
				.post("/api/getFavs", { userId: user.id })
				.then((data) => {
					setFavs(data.data.data.favs);
				})
				.catch((err) => {
					console.error(err);
					setInfo("Error while fetching your favorites.");
				});
		}
		if (user.id !== "") fetchUserfavs();
	}, [user.id]);
	
	useEffect(() => {
		setColorScheme(isDarkTheme ? "dark" : "");
	}, [isDarkTheme]);

	const musicContextValue = {
		song,
		setSong,
		info,
		setInfo,
		user,
		setUser,
		isPaused,
		setIsPaused,
		queue,
		setQueue,
		songProgress,
		setSongProgress,
		hasChanged,
		setHasChanged,
		isSongRequester,
		setIsRequester,
		isAdding,
		setIsAdding,
		isAddingFirst,
		setIsAddingFirst,
		isShuffling,
		setIsShuffling,
		isClearing,
		setIsClearing,
		isSkipping,
		setIsSkipping,
		favs,
		setFavs,
		infoboxColor,
		setInfoboxColor,
		colorScheme,
		setColorScheme,
	} 

	if (isLoading) return (
		<div className="loader-container">
			<div className="spinner"></div>
		</div>
	);

	return (
		<div className={classes}>
			<MusicContext.Provider value={musicContextValue}>
				<NowplayingCard />
				<Queue />
				<Favs />
				<Filters/>
			</MusicContext.Provider>
		</div>
	);
};

export default Music;
