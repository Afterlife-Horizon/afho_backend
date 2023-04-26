import { Video } from "youtube-sr"

export interface IESong extends Video {
	id: string
	requester: User
}

export interface Track {
	seekTime: number
	id: string
	title: string
	durationFormatted: string
	requester: User
	thumbnail: Thumbnail
}

export interface IQueue {
	textChannel: string
	paused: boolean
	skipped: boolean
	effects: IFilters
	trackloop: boolean
	queueloop: boolean
	filtersChanged: boolean
	volume: number
	tracks: IESong[]
	previous: IESong | undefined
	creator: User
	bitrate: number
	autoplay: boolean
}

export interface IFilters {
	bassboost: number
	subboost: boolean
	mcompand: boolean
	haas: boolean
	gate: boolean
	karaoke: boolean
	flanger: boolean
	pulsator: boolean
	surrounding: boolean
	"3d": boolean
	vaporwave: boolean
	nightcore: boolean
	phaser: boolean
	normalizer: boolean
	speed: number
	tremolo: boolean
	vibrato: boolean
	reverse: boolean
	treble: boolean
}

export interface IFavorite {
	id: string
	name: string
	url: string
	thumbnail: string
	type: "video" | "playlist"
}
