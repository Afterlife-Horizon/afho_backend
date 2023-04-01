import { createContext } from "react"
import { song, track, EnhancedUser } from "../types"
import { defaultSong } from "../constants"

interface IMusicContext {
	song: song
	setSong: React.Dispatch<React.SetStateAction<song>>
	info: string
	setInfo: React.Dispatch<React.SetStateAction<string>>
	user: EnhancedUser | undefined
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
	infoboxColor: string
	setInfoboxColor: React.Dispatch<React.SetStateAction<string>>
	colorScheme: string
	setColorScheme: React.Dispatch<React.SetStateAction<string>>
}

const MusicContext = createContext<IMusicContext>({
	song: defaultSong,
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
	infoboxColor: "",
	setInfoboxColor: value => {},
	colorScheme: "",
	setColorScheme: value => {}
})

export default MusicContext
