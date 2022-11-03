import React, { useEffect, useState } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import "../css/brasilboard.css";

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

interface testCallback {
	(err: any, status: any, data: any): any;
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

const Brasilboard: React.FC = () => {
	const [data, setData] = useState<{ user: user; counter: number }[]>([]);

	useEffect(() => {
		const fetchInfo = async (callback: testCallback) => {
			await axios
				.get("/api/brasilBoard")
				.then((res) => {
					// console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		fetchInfo((err, status, data) => {
			if (err) return;
			if (status !== 200) return;
			setData(data);
		});
	}, []);

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
		<div className="brasilboard">
			<Box sx={{ marginInline: "25vw" }}>
				<TableContainer component={Paper} sx={{ maxHeight: "80vh" }}>
					<Table stickyHeader>
						<TableHead>
							<StyledTableRow>
								<StyledTableCell />
								<StyledTableCell>USER</StyledTableCell>
								<StyledTableCell align="right">COUNT</StyledTableCell>
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
									<StyledTableCell align="right">{u.counter}</StyledTableCell>
								</StyledTableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</div>
	);
};

export default Brasilboard;
