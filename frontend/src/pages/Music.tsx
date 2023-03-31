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
import getBotInfo from "../utils/getBotinfo"
import useUser from "../hooks/useUser"
import Spinner from "../components/Spinner"
import { EnhancedUser, song, track, fav } from "../types"
import useFetchInfo from "../hooks/useFetchInfo"

const Music = (props: any) => {
	const isDarkTheme = window.matchMedia("(prefers-color-scheme:dark)").matches
	const navigate = useNavigate()

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
	const { data: fetchInfo, isLoading: isFetchingInfo, isError: isFetchingInfoError } = useFetchInfo()

	useEffect(() => {
		if (!fetchInfo) return

		const queue = fetchInfo.queue[0]
		let tmpIsRequester = false
		if (queue && queue.tracks[0]) {
			setSong({
				name: queue.tracks[0].title,
				artist: queue.tracks[0].channel.name,
				filters: queue.effects,
				requester: queue.tracks[0].requester,
				url: "https://www.youtube.com/watch?v=" + queue.tracks[0].id,
				formatedprog: fetchInfo.formatedprog,
				duration: queue.tracks[0].durationFormatted,
				cover_src: queue.tracks[0].thumbnail.url
			})
			setIsPaused(queue.paused)
			setQueue(queue.tracks.slice(0))
			setSongProgress(Math.floor(100 * (fetchInfo.prog / queue.tracks[0].duration)))
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
		const isAdmin: boolean = fetchInfo.admins.usernames.includes(user?.user_metadata.full_name)
		if (apiUser) {
			if (apiUser.id !== user?.id) setUser({ ...apiUser, isAdmin })
		}
		setIsRequester(tmpIsRequester)
		setIsClearing(false)
		setIsSkipping(false)
		setIsAddingFirst(false)
		setIsShuffling(false)
	}, [fetchInfo, apiUser?.id])

	useEffect(() => {
		setColorScheme(isDarkTheme ? "dark" : "")
	}, [isDarkTheme])

	if (isLoading) return <Spinner />
	if (isError) navigate("/login")

	if (isFetchingInfo) return <Spinner />
	if (isFetchingInfoError) return <div>There was an error fetching the bot info</div>

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
		infoboxColor,
		setInfoboxColor,
		colorScheme,
		setColorScheme
	}

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
