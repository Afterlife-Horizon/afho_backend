import React, { useEffect, useState } from "react";
import axios from "axios";
import AdvBrasil from "./AdvBrasil";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import "../css/brasilboard.css";

interface testCallback {
	(err: any, status: any, data: any): any;
}

type DATA = {
	id: string;
	bot: boolean;
	system: boolean;
	flags: number;
	username: string;
	discriminator: string;
	avatar: string;
	createdTimestamp: number;
	defaultAvatarURL: string;
	tag: string;
	avatarURL: string;
	displayAvatarURL: string;
}[];

type user = {
	guildId: string;
	joinedTimestamp: number;
	premiumSinceTimestamp: number | null;
	nickname: null | string;
	pending: boolean;
	communicationDisabledUntilTimestamp: number | null;
	userId: string;
	avatar: string | null;
	displayName: string;
	roles: string[];
	avatarURL: string | null;
	displayAvatarURL: string;
};

type COUNTS = { user: user; counter: number }[];

const fetchConnectedUsers = async (callback: testCallback) => {
	await axios
		.get("/api/connectedMembers")
		.then((res) => {
			callback(null, res.status, res.data);
		})
		.catch((err) => {
			callback(err, err.response.status, err.response.data);
		});
};

const fetchInfo = async (callback: testCallback) => {
	await axios
		.get("/api/brasilBoard")
		.then((res) => {
			// console.log(res);
			callback(null, res.status, res.data);
		})
		.catch((err) => {
			callback(err, err.response.status, err.response.data);
		});
};

const Brasilboard: React.FC = () => {
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
	const [currentPlayer, setCurrentPlayer] = useState("");

	const [data, setData] = useState<DATA>([]);
	const [counts, setCounts] = useState<COUNTS>([]);

	const memberNames = data ? data.map((m) => m.username) : [];

	const [info, setInfo] = useState("");
	useEffect(() => {
		const access_token = localStorage.getItem("access_token");

		if (!access_token) {
			setInfo("Please log in!");
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
				setUser({ ...data });
			});
		}
	}, []);

	const autocompleteCheckValue = (option: any, newValue: any) => option === newValue || newValue === "";
	const handleChangeCurrentPlayer = (event: any, values: any) => setCurrentPlayer(values);
	const handleLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		window.location.replace("https://discord.com/api/oauth2/authorize?client_id=1028294291698765864&redirect_uri=https%3A%2F%2Fmusic.afterlifehorizon.net%2F&response_type=code&scope=identify");
	};
	const handleBresilClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		const movedMemberId = data.find((m) => m.username === currentPlayer)?.id;

		if (currentPlayer === "" || !movedMemberId) return setInfo("member is not set");

		const bresilMember = async (callback: testCallback) => {
			await axios
				.post(
					"/api/bresilMember",
					{ moverId: user.id, movedId: movedMemberId },
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

		bresilMember((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data);
				else setInfo("An error occured");
				return;
			}
			setInfo("OK!");
		});
	};

	useEffect(() => {
		fetchConnectedUsers((err, status, data) => {
			if (err || status !== 200) setInfo("There was an error");
			setData(data.data);
		});
		fetchInfo((err, status, data) => {
			if (err) return;
			if (status !== 200) return;
			setCounts(data);
		});
	}, []);

	const [intervalReset, setIntervalReset] = useState(false);
	useEffect(() => {
		const repeatedFetchInterval = setInterval(() => {
			fetchConnectedUsers((err, status, data) => {
				if (err || status !== 200) setInfo("There was an error");
				setData(data.data);
			});
			fetchInfo((err, status, data) => {
				if (err) return;
				if (status !== 200) return;
				setCounts(data);
			});
			setIntervalReset((prev) => !prev);
		}, 5_000);

		return () => {
			clearInterval(repeatedFetchInterval);
		};
	}, [intervalReset]);

	return (
		<div className="brasilboard">
			<Box sx={{ marginInline: "25vw" }}>
				{memberNames.includes(user.username) ? (
					<div style={{ display: "flex", padding: "0.5rem", backgroundColor: "white", alignItems: "center", justifyContent: "space-between" }}>
						<Autocomplete
							style={{ width: "78%" }}
							disableClearable
							freeSolo
							disablePortal
							isOptionEqualToValue={autocompleteCheckValue}
							value={currentPlayer}
							options={memberNames}
							onChange={handleChangeCurrentPlayer}
							renderInput={(params) => <TextField {...params} variant="filled" label="Member" />}
						/>

						<Button style={{ maxWidth: "20%" }} variant="contained" onClick={handleBresilClicked}>
							bresil
						</Button>
					</div>
				) : user.username !== "" ? (
					<div style={{ display: "flex", flexFlow: "row", padding: "0.5rem", backgroundColor: "white", alignItems: "center", justifyContent: "center" }}>
						<div>join a voice channel to use brasil</div>
					</div>
				) : (
					<div style={{ display: "flex", flexFlow: "row", padding: "0.5rem", backgroundColor: "white", alignItems: "center", justifyContent: "space-between" }}>
						<button onClick={handleLogin} className="blue-button">
							Login with Discord
						</button>
					</div>
				)}
				<AdvBrasil data={counts} />
			</Box>
		</div>
	);
};

export default Brasilboard;
