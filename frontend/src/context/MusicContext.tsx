import { User } from "@supabase/supabase-js"
import { createContext } from "react"
import { song, track, fav } from "../types"

interface IMusicContext {
	song: song
	setSong: React.Dispatch<React.SetStateAction<song>>
	info: string
	setInfo: React.Dispatch<React.SetStateAction<string>>
	user: User | undefined
	isPaused: boolean
	setIsPaused: React.Dispatch<React.SetStateAction<boolean>>
	queue: track[]
	setQueue: React.Dispatch<React.SetStateAction<track[]>>
	songProgress: number
	setSongProgress: React.Dispatch<React.SetStateAction<number>>
	hasChanged: boolean
	setHasChanged: React.Dispatch<React.SetStateAction<boolean>>
	isSongRequester: boolean
	setIsRequester: React.Dispatch<React.SetStateAction<boolean>>
	isAdding: boolean
	setIsAdding: React.Dispatch<React.SetStateAction<boolean>>
	isAddingFirst: boolean
	setIsAddingFirst: React.Dispatch<React.SetStateAction<boolean>>
	isShuffling: boolean
	setIsShuffling: React.Dispatch<React.SetStateAction<boolean>>
	isClearing: boolean
	setIsClearing: React.Dispatch<React.SetStateAction<boolean>>
	isSkipping: boolean
	setIsSkipping: React.Dispatch<React.SetStateAction<boolean>>
	favs: fav[]
	setFavs: React.Dispatch<React.SetStateAction<fav[]>>
	infoboxColor: string
	setInfoboxColor: React.Dispatch<React.SetStateAction<string>>
	colorScheme: string
	setColorScheme: React.Dispatch<React.SetStateAction<string>>
}

const MusicContext = createContext<IMusicContext>({
	song: {
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
	},
	setSong: value => {},
	info: "",
	setInfo: value => {},
	user: undefined,
	isPaused: false,
	setIsPaused: value => {},
	queue: [],
	setQueue: value => {},
	songProgress: 0,
	setSongProgress: value => {},
	hasChanged: false,
	setHasChanged: value => {},
	isSongRequester: false,
	setIsRequester: value => {},
	isAdding: false,
	setIsAdding: value => {},
	isAddingFirst: false,
	setIsAddingFirst: value => {},
	isShuffling: false,
	setIsShuffling: value => {},
	isClearing: false,
	setIsClearing: value => {},
	isSkipping: false,
	setIsSkipping: value => {},
	favs: [],
	setFavs: value => {},
	infoboxColor: "",
	setInfoboxColor: value => {},
	colorScheme: "",
	setColorScheme: value => {}
})

export default MusicContext
