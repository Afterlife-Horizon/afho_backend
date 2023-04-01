import { song } from "./types"

export const defaultSong = {
	name: "None",
	artist: "",
	requester: null,
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
} as song
