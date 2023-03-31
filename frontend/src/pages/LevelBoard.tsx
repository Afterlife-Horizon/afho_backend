import React, { useEffect, useState } from "react"
import axios from "axios"
import Box from "@mui/material/Box"
import "../css/brasilboard.css"
import AdvLevel from "../components/AdvLevel"

interface testCallback {
	(err: any, status: any, data: any): any
}

type user = {
	guildId: string
	joinedTimestamp: number
	premiumSinceTimestamp: number | null
	nickname: null | string
	pending: boolean
	communicationDisabledUntilTimestamp: number | null
	userId: string
	avatar: string | null
	displayName: string
	roles: string[]
	avatarURL: string | null
	displayAvatarURL: string
}

type userXp = { user: user; xp: number; lvl: number }[]

const fetchInfo = async (callback: testCallback) => {
	await axios
		.get("/api/levels")
		.then(res => {
			callback(null, res.status, res.data)
		})
		.catch(err => {
			callback(err, err.response.status, err.response.data)
		})
}

const LevelBoard: React.FC = () => {
	const [counts, setCounts] = useState<userXp>([])

	const [intervalReset, setIntervalReset] = useState(false)
	useEffect(() => {
		const repeatedFetchInterval = setInterval(() => {
			fetchInfo((err, status, data) => {
				if (err) return
				if (status !== 200) return
				setCounts(data)
			})
			setIntervalReset(prev => !prev)
		}, 5_000)

		return () => {
			clearInterval(repeatedFetchInterval)
		}
	}, [intervalReset])

	return (
		<div className="brasilboard">
			<Box sx={{ marginInline: "25vw" }}>
				<AdvLevel data={counts} />
			</Box>
		</div>
	)
}

export default LevelBoard
