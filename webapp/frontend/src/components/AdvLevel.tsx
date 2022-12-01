import React from "react";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

type user = {
	guildId: string;
	joinedTimestamp: number;
	premiumSinceTimestamp: number | null;
	nickname: null | string;
	pending: boolean;
	communicationDisabledUntilTimestamp: number | null;
	userId: string;
	avatar: string | null;
	displayName: string;
	roles: string[];
	avatarURL: string | null;
	displayAvatarURL: string;
};

interface props {
	data: { user: user; xp: number }[];
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
	[`&.${tableCellClasses.head}`]: {
		backgroundColor: theme.palette.common.black,
		color: theme.palette.common.white,
		fontSize: "1.2rem",
	},
	[`&.${tableCellClasses.body}`]: {
		fontSize: "1rem",
	},
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
	"&:nth-of-type(odd)": {
		backgroundColor: theme.palette.action.hover,
	},
	// hide last border
	"&:last-child td, &:last-child th": {
		border: 0,
	},
}));

const AdvLevel: React.FC<props> = ({ data }) => {
	function stringOfRank(rank: number) {
		switch (rank) {
			case 1:
				return "1st";
			case 2:
				return "2nd";
			case 3:
				return "3rd";
			default:
				return `${rank.toString()}th`;
		}
	}
    
	return (
		<TableContainer component={Paper} sx={{ maxHeight: "80vh" }}>
			<Table stickyHeader>
				<TableHead>
					<StyledTableRow>
						<StyledTableCell />
						<StyledTableCell>USER</StyledTableCell>
						<StyledTableCell align="right">XP</StyledTableCell>
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
							<StyledTableCell align="right">{u.xp}</StyledTableCell>
						</StyledTableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default AdvLevel;
