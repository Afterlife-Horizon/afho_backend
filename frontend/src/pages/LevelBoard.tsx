import React from "react"

import Box from "@mui/material/Box"
import "../css/brasilboard.css"
import AdvLevel from "../components/AdvLevel"
import useLevels from "../hooks/useLevels"
import Spinner from "../components/Spinner"

const LevelBoard: React.FC = () => {
	const { data: counts, isLoading, isError } = useLevels()

	if (isLoading)
		return (
			<div className="brasilboard">
				<Box sx={{ marginInline: "25vw" }}>
					<Spinner />
				</Box>
			</div>
		)
	if (isError) return <div>Something went wrong</div>

	return (
		<div className="brasilboard">
			<Box sx={{ marginInline: "25vw" }}>
				<AdvLevel data={counts} />
			</Box>
		</div>
	)
}

export default LevelBoard
