import React, { useEffect, useState } from "react"
import axios from "axios"
import Box from "@mui/material/Box"
import "../css/brasilboard.css"
import AdvLevel from "../components/AdvLevel"
import useLevels from "../hooks/useLevels"
import Spinner from "../components/Spinner"

interface testCallback {
	(err: any, status: any, data: any): any
}

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
