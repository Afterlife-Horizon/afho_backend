import React, { useEffect, useState } from "react"
import axios from "axios"
import AdvBrasil from "../components/AdvBrasil"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import "../css/brasilboard.css"
import { useNavigate } from "react-router-dom"
import useUser from "../hooks/useUser"
import Spinner from "../components/Spinner"
import useBresilCounts from "../hooks/useBresilCounts"
import useConnectedMembers from "../hooks/useConnectedMembers"
interface testCallback {
	(err: any, status: any, data: any): any
}

const Brasilboard: React.FC = () => {
	const { data: user, isLoading } = useUser()
	const { data: counts, isLoading: isLoadingCounts, isError: isErrorCounts } = useBresilCounts()
	const { data: connectedMembers, isLoading: isLoadingConnectedMembers, isError: isErrorConnectedMembers } = useConnectedMembers()

	if (isLoading || isLoadingCounts || isLoadingConnectedMembers) return <Spinner />
	if (isErrorCounts || isErrorConnectedMembers) return <div>Something went wrong</div>

	if (!connectedMembers || !counts) return <div>Something went wrong</div>

	const [currentPlayer, setCurrentPlayer] = useState("")
	const navigate = useNavigate()

	const memberNames = connectedMembers ? connectedMembers.map(m => m.username) : []

	const [info, setInfo] = useState("")

	function autocompleteCheckValue(option: any, newValue: any) {
		return option === newValue || newValue === ""
	}

	function handleChangeCurrentPlayer(event: any, values: any) {
		setCurrentPlayer(values)
	}

	function handleLogin(event: React.MouseEvent<HTMLButtonElement>) {
		navigate("/login")
	}

	function handleBresilClicked(event: React.MouseEvent<HTMLButtonElement>) {
		event.preventDefault()

		const movedMemberId = connectedMembers?.find(m => m.username === currentPlayer)?.id

		if (currentPlayer === "" || !movedMemberId) return setInfo("member is not set")

		const bresilMember = async (callback: testCallback) => {
			await axios
				.post(
					"/api/bresilMember",
					{ moverId: user?.user_metadata.provider_id, movedId: movedMemberId },
					{
						headers: { "Content-Type": "application/json" }
					}
				)
				.then(res => {
					callback(null, res.status, res.data)
				})
				.catch(err => {
					callback(err, err.response.status, err.response.data)
				})
		}

		bresilMember((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data)
				else setInfo("An error occured")
				return
			}
			setInfo("OK!")
		})
	}

	return (
		<div className="brasilboard">
			<Box sx={{ marginInline: "25vw" }}>
				{memberNames.includes(user?.user_metadata.full_name) ? (
					<div
						style={{
							display: "flex",
							padding: "0.5rem",
							backgroundColor: "white",
							alignItems: "center",
							justifyContent: "space-between"
						}}
					>
						<Autocomplete
							style={{ width: "78%" }}
							disableClearable
							freeSolo
							disablePortal
							isOptionEqualToValue={autocompleteCheckValue}
							value={currentPlayer}
							options={memberNames}
							onChange={handleChangeCurrentPlayer}
							renderInput={params => <TextField {...params} variant="filled" label="Member" />}
						/>

						<Button style={{ maxWidth: "20%" }} variant="contained" onClick={handleBresilClicked}>
							bresil
						</Button>
					</div>
				) : user?.user_metadata.full_name !== "" ? (
					<div
						style={{
							display: "flex",
							flexFlow: "row",
							padding: "0.5rem",
							backgroundColor: "white",
							alignItems: "center",
							justifyContent: "center"
						}}
					>
						<div>join a voice channel to use brasil</div>
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flexFlow: "row",
							padding: "0.5rem",
							backgroundColor: "white",
							alignItems: "center",
							justifyContent: "space-between"
						}}
					>
						<button onClick={handleLogin} className="blue-button">
							Login with Discord
						</button>
					</div>
				)}
				<AdvBrasil data={counts ? counts : []} />
			</Box>
		</div>
	)
}

export default Brasilboard
