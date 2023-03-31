import React, { useContext, useState } from "react"
import MusicContext from "../context/MusicContext"
import { Avatar, Card } from "antd"
import Meta from "antd/lib/card/Meta"
import { supabase } from "../utils/supabaseUtils"
import { useNavigate } from "react-router-dom"

const NowplayingCard: React.FC = () => {
	const [isDisconnecting, setIsDisconnecting] = useState(false)
	const [isPausing, setIsPausing] = useState(false)
	const [isStopping, setIsStopping] = useState(false)
	const navigate = useNavigate()

	const {
		user,
		info,
		setInfo,
		infoboxColor,
		setInfoboxColor,
		queue,
		isSongRequester,
		isSkipping,
		setIsSkipping,
		song,
		isPaused,
		songProgress,
		setColorScheme
	} = useContext(MusicContext)

	const handleNextClicked = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsSkipping(true)

		if (!queue || queue.length < 2) {
			setIsSkipping(false)
			setInfo("No song to skip to!")
			return setInfoboxColor("orange")
		}

		const res = await fetch("/api/skip", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: user?.user_metadata.full_name })
		})

		setIsSkipping(false)
		if (res.status === 200) {
			const data = await res.json()
			if (data.success) {
				setInfo("Skipped!")
				setInfoboxColor("green")
			} else {
				setInfo(data.message)
				setInfoboxColor("orange")
			}
		} else {
			setInfo("An error occured")
			setInfoboxColor("red")
		}
	}

	const handlePauseClicked = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsPausing(true)

		if (!queue || queue.length < 1) {
			setIsPausing(false)
			setInfo("No song playing!")
			return setInfoboxColor("orange")
		}

		if (isPaused) {
			const res = await fetch("/api/unpause", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: user?.user_metadata.full_name })
			})

			setIsPausing(false)
			if (res.status === 200) {
				const data = await res.json()
				if (data.success) {
					setInfo("Resumed!")
					setInfoboxColor("green")
				} else {
					setInfo(data.message)
					setInfoboxColor("orange")
				}
			} else {
				setInfo("An error occured")
				setInfoboxColor("red")
			}
		} else {
			const res = await fetch("/api/pause", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: user?.user_metadata.full_name })
			})

			setIsPausing(false)
			if (res.status === 200) {
				const data = await res.json()
				if (data.success) {
					setInfo("Paused!")
					setInfoboxColor("green")
				} else {
					setInfo(data.message)
					setInfoboxColor("orange")
				}
			} else {
				setInfo("An error occured")
				setInfoboxColor("red")
			}
		}
	}

	const handleStopClicked = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsStopping(true)

		if (!user?.isAdmin) {
			setIsStopping(false)
			setInfo("You need to be admin!")
			return setInfoboxColor("orange")
		}

		if (!queue || queue.length < 1) {
			setIsStopping(false)
			setInfo("No song playing!")
			return setInfoboxColor("orange")
		}

		const res = await fetch("/api/stop", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: user?.user_metadata.full_name })
		})

		setIsStopping(false)
		if (res.status === 200) {
			const data = await res.json()
			if (data.success) {
				setInfo("Stopped playing!")
				setInfoboxColor("green")
			} else {
				setInfo(data.message)
				setInfoboxColor("orange")
			}
		} else {
			setInfo("An error occured")
			setInfoboxColor("red")
		}
	}

	const handleDisconnectClicked = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsDisconnecting(true)

		if (!user?.isAdmin) {
			setIsDisconnecting(false)
			setInfo("You need to be admin!")
			return setInfoboxColor("orange")
		}

		const res = await fetch("/api/disconnect", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user: user.user_metadata.full_name })
		})

		setIsDisconnecting(false)
		if (res.status === 200) {
			const data = await res.json()
			if (data.success) {
				setInfo("Disconnected the bot!")
				setInfoboxColor("green")
			} else {
				setInfo(data.message)
				setInfoboxColor("orange")
			}
		} else {
			setInfo("An error occured")
			setInfoboxColor("red")
		}
	}

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut()
		if (error) return
		navigate("/login")
	}

	let checkRequester = !user?.isAdmin && !isSongRequester

	return (
		<div className="nowplaying">
			<div className="nowplaying-card ant-card brasilboardd">
				<a href={"/brasilboard"}>
					<button>BRASILBOARD</button>
				</a>
				<button onClick={() => setColorScheme(prev => (prev === "" ? "dark" : ""))}>CHANGE THEME</button>
			</div>
			<Card
				className="nowplaying-card"
				cover={<img className="nowplaying-img" alt="example" src={song.cover_src} />}
				actions={[
					<button disabled={!user?.isAdmin} className="next" onClick={handleDisconnectClicked}>
						{isDisconnecting ? <div className="small-spinner"></div> : "DISCONNECT"}
					</button>,
					<button disabled={!user?.isAdmin} className="next" onClick={handleStopClicked}>
						{isStopping ? <div className="small-spinner"></div> : "STOP"}
					</button>,
					<button disabled={checkRequester} className="next" onClick={handlePauseClicked}>
						{isPausing ? <div className="small-spinner"></div> : isPaused ? "UNPAUSE" : "PAUSE"}
					</button>,
					<button disabled={checkRequester} className="next" onClick={handleNextClicked}>
						{isSkipping ? <div className="small-spinner"></div> : "SKIP"}
					</button>
				]}
			>
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
				<Meta avatar={<Avatar src={user?.user_metadata.avatar_url} />} title={user?.user_metadata.name} />
			</Card>
			<div className="nowplaying-card ant-card">
				<button onClick={handleSignOut}>LOG OUT</button>
			</div>
			<div style={{ border: `1px solid ${infoboxColor}` }} className="nowplaying-card ant-card infobox">
				{info}
			</div>
		</div>
	)
}

export default NowplayingCard
