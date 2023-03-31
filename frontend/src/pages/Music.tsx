// ------------ Packages ------------
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import MusicContext from "../context/MusicContext"

// ------------ Components ------------
import Queue from "../components/Queue"
import Filters from "../components/Filters"
import Favs from "../components/Favs"

// ------------ CSS Files ------------
import "antd/dist/antd.css"
import "../css/Music.css"
import "../css/dark/Music.css"
import NowplayingCard from "../components/NowplayingCard"
import getUserFavorites from "../utils/getUserFavorites"
import getBotInfo from "../utils/getBotinfo"
import useUser from "../hooks/useUser"
import Spinner from "../components/Spinner"
import { EnhancedUser, song, track, fav } from "../types"

const Music = (props: any) => {
	const isDarkTheme = window.matchMedia("(prefers-color-scheme:dark)").matches
	const navigate = useNavigate()

	const [favs, setFavs] = useState<fav[]>([])
	const [colorScheme, setColorScheme] = useState<string>("")
	const classes = "music " + props.className + " " + colorScheme

	const [info, setInfo] = useState<string>("")
	const [infoboxColor, setInfoboxColor] = useState<string>("white")
	const [isPaused, setIsPaused] = useState<boolean>(false)
	const [queue, setQueue]: any[] = useState<track[]>([])
	const [songProgress, setSongProgress] = useState<number>(0)
	const [hasChanged, setHasChanged] = useState<boolean>(true)
	const [isSongRequester, setIsRequester] = useState<boolean>(true)
	const [user, setUser] = useState<EnhancedUser | undefined>(undefined)

	const [isSkipping, setIsSkipping] = useState<boolean>(false)
	const [isAdding, setIsAdding] = useState<boolean>(false)
	const [isAddingFirst, setIsAddingFirst] = useState<boolean>(false)
	const [isShuffling, setIsShuffling] = useState<boolean>(false)
	const [isClearing, setIsClearing] = useState<boolean>(false)
	const [intervalReset, setIntervalReset] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<string>("")

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
			treble: false
		},
		url: "",
		formatedprog: "00:00",
		duration: "00:00",
		cover_src: "https://freesvg.org/img/aiga_waiting_room_bg.png"
	})

	const { data: apiUser, isLoading, isError } = useUser()

	async function fetchBotInfo() {
		try {
			const res = await getBotInfo()

			setLoading(false)

			const queue = res.queue[0]
			let tmpIsRequester = false
			if (queue && queue.tracks[0]) {
				setSong({
					name: queue.tracks[0].title,
					artist: queue.tracks[0].channel.name,
					filters: queue.effects,
					requester: queue.tracks[0].requester,
					url: "https://www.youtube.com/watch?v=" + queue.tracks[0].id,
					formatedprog: res.formatedprog,
					duration: queue.tracks[0].durationFormatted,
					cover_src: queue.tracks[0].thumbnail.url
				})
				setIsPaused(queue.paused)
				setQueue(queue.tracks.slice(0))
				setSongProgress(Math.floor(100 * (res.prog / queue.tracks[0].duration)))
				setHasChanged(queue.filtersChanged)
				tmpIsRequester = user?.user_metadata.full_name === queue.tracks[0].requester
			} else {
				setHasChanged(false)
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
						treble: false
					},
					url: "",
					formatedprog: "00:00",
					duration: "00:00",
					cover_src: "https://freesvg.org/img/aiga_waiting_room_bg.png"
				})
				setQueue([])
			}
			const isAdmin: boolean = res.admins.usernames.includes(user?.user_metadata.full_name)
			if (apiUser) {
				setUser({ ...apiUser, isAdmin })
			}
			setIsRequester(tmpIsRequester)
			setIntervalReset(prev => !prev)
			setIsClearing(false)
			setIsSkipping(false)
			setIsAddingFirst(false)
			setIsShuffling(false)
		} catch (err) {
			localStorage.clear()
			setError("A probleme occured!")
			return window.location.replace("/login")
		}
	}

	useEffect(() => {
		fetchBotInfo()
	}, [])

	useEffect(() => {
		const repeatedFetchInterval = setInterval(() => {
			fetchBotInfo()
		}, 2000)

		return () => {
			clearInterval(repeatedFetchInterval)
		}
	}, [intervalReset])

	useEffect(() => {
		try {
			if (user?.id === "") return

			async function fetchUserfavs() {
				try {
					const res = await getUserFavorites(user?.user_metadata.provider_id)
					setFavs(res.favorites)
				} catch (err) {
					console.error(err)
				}
			}
			fetchUserfavs()
		} catch (err) {
			console.error(err)
			setError("A probleme occured!")
		}
	}, [user?.id])

	useEffect(() => {
		setColorScheme(isDarkTheme ? "dark" : "")
	}, [isDarkTheme])

	if (isLoading) return <Spinner />
	if (isError || !user) navigate("/login")

	if (error) return <div>error: {error}</div>
	if (loading) return <Spinner />

	if (!user) navigate("/login")

	const musicContextValue = {
		song,
		setSong,
		info,
		setInfo,
		user,
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
		setColorScheme
	}

	if (isLoading)
		return (
			<div className="loader-container">
				<div className="spinner"></div>
			</div>
		)

	if (error)
		return (
			<div className="error-container">
				<p>{error}</p>
			</div>
		)

	return (
		<div className={classes}>
			<MusicContext.Provider value={musicContextValue}>
				<NowplayingCard />
				<Queue />
				<Favs />
				<Filters />
			</MusicContext.Provider>
		</div>
	)
}

export default Music
