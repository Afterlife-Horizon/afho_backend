import React from "react"
import Avatar from "@mui/material/Avatar"
import { styled } from "@mui/material/styles"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell, { tableCellClasses } from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"

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

type COUNTS = {
	user: user
	bresil_received: number
	bresil_sent: number
}[]

interface props {
	setData: React.Dispatch<React.SetStateAction<COUNTS>>
	data: {
		user: user
		bresil_received: number
		bresil_sent: number
	}[]
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
	[`&.${tableCellClasses.head}`]: {
		backgroundColor: theme.palette.common.black,
		color: theme.palette.common.white,
		fontSize: "1.2rem"
	},
	[`&.${tableCellClasses.body}`]: {
		fontSize: "1rem"
	}
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
	"&:nth-of-type(odd)": {
		backgroundColor: theme.palette.action.hover
	},
	// hide last border
	"&:last-child td, &:last-child th": {
		border: 0
	}
}))

const AdvBrasil: React.FC<props> = ({ setData, data }) => {
	function stringOfRank(rank: number) {
		switch (rank) {
			case 1:
				return "1st"
			case 2:
				return "2nd"
			case 3:
				return "3rd"
			default:
				return `${rank.toString()}th`
		}
	}

	function handleSortClicked(type: number) {
		return () => {
			data.sort((a, b) => {
				if (type === 1) {
					return b.bresil_received - a.bresil_received
				} else if (type === 2) {
					return b.bresil_sent - a.bresil_sent
				} else {
					return 0
				}
			})

			setData([...data])
		}
	}

	return (
		<TableContainer component={Paper} sx={{ maxHeight: "80vh" }}>
			<Table stickyHeader>
				<TableHead>
					<StyledTableRow>
						<StyledTableCell />
						<StyledTableCell>USER</StyledTableCell>
						<StyledTableCell onClick={handleSortClicked(1)} align="right">
							COUNT
						</StyledTableCell>
						<StyledTableCell onClick={handleSortClicked(2)} align="right">
							GIVEN
						</StyledTableCell>
					</StyledTableRow>
				</TableHead>
				<TableBody>
					{data.map((u, index) => (
						<StyledTableRow key={u.user.userId}>
							<StyledTableCell align="center" style={{ fontWeight: "700", marginInline: "0", paddingInline: "0", minWidth: 0 }}>
								{stringOfRank(index + 1)}
							</StyledTableCell>
							<StyledTableCell component="th" scope="row">
								<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
									<Avatar alt={u.user.displayName} src={u.user.displayAvatarURL} />
									{u.user.nickname ? u.user.nickname : u.user.displayName}
								</div>
							</StyledTableCell>
							<StyledTableCell align="right">{u.bresil_received}</StyledTableCell>
							<StyledTableCell align="right">{u.bresil_sent}</StyledTableCell>
						</StyledTableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	)
}

export default AdvBrasil
