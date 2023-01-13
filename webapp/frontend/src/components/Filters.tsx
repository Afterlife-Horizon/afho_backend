// ------------ Packages ------------
import React, { useEffect, useState } from "react";
import { Switch, Input } from "antd";
import axios from "axios";
const _ = require("lodash");

// ------------ CSS Files ------------
import "../css/Filters.css";
import "../css/dark/Filters.css";

interface testCallback {
	(err: any, status: any, data: any): any;
}

const Filters: React.FC<any> = (props) => {
	const [inputValues, setInputValues] = useState({
		bassboost: "",
		speed: "",
	});
	const filters = [
		"bassboost",
		"speed",
		"subboost",
		"mcompand",
		"haas",
		"gate",
		"karaoke",
		"flanger",
		"pulsator",
		"surrounding",
		"3d",
		"vaporwave",
		"nightcore",
		"phaser",
		"normalizer",
		"tremolo",
		"vibrato",
		"reverse",
		"treble",
	];

	const [effects, setEffects] = useState({
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
		treble: false,
	});

	const handleChangeFilter = (filter: any) => {
		return (state: boolean) => {
			setEffects((prev: any) => ({ ...prev, [filter]: state }));
			setIsChecked((prev: any) => ({ ...prev, [filter]: state }));
		};
	};

	const handleChangeFilterWithValues = (filter: string) => {
		return (event: any) => {
			event.preventDefault();
			setEffects((prev) => ({ ...prev, [filter]: event.target.value }));
			setInputValues((prev: any) => ({
				...prev,
				[filter]: event.target.value,
			}));
			// console.log(effects);
		};
	};

	const handlefilterSubmitted = (event: any) => {
		event.preventDefault();

		const changeSongFilter = async (callback: testCallback) => {
			await axios
				.post(
					"/api/filters",
					{ filters: { ...effects }, user: props.user.username },
					{
						headers: { "Content-Type": "application/json" },
					}
				)
				.then((res) => {
					console.log(res);
					callback(null, res.status, res.data);
				})
				.catch((err) => {
					callback(err, err.response.status, err.response.data);
				});
		};

		if (!props.user.isAdmin) {
			props.setInfo("You need to be admin!");
			return props.setInfoboxColor("orange");
		}

		changeSongFilter((err, status, data) => {
			if (err) {
				if (status !== 500) props.setInfo(data);
				else props.setInfo("An error occured");
				props.setInfoboxColor("red");
				return console.error(err);
			}
			setInputValues({ bassboost: "", speed: "" });
			setEffects({
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
				treble: false,
			});
			// console.log(data);
		});
	};

	const [isChecked, setIsChecked]: any[] = useState(
		_.flow([
			Object.entries,
			(arr: any) =>
				arr.filter(([, value]: any[]) => typeof value === "boolean"),
			Object.fromEntries,
		])(props.filters)
	);

	useEffect(() => {
		const updateChecked = () => {
			setIsChecked(
				_.flow([
					Object.entries,
					(arr: any) =>
						arr.filter(([, value]: any[]) => typeof value === "boolean"),
					Object.fromEntries,
				])(props.filters)
			);
		};
		updateChecked();
	}, [props.hasChanged]);

	return (
		<form className="filters">
			<h3>Filters</h3>
			<Input
				disabled={!props.user.isAdmin}
				type="submit"
				value="Submit"
				onClick={handlefilterSubmitted}
			/>

			<ul>
				{filters.map((filter) => {
					return (
						<li className="filterUl" key={filter}>
							<div className="filtername">{filter}: </div>
							<div>
								{filter === "bassboost" || filter === "speed" ? (
									<Input
										key={filter}
										placeholder={"Current: " + props.filters[filter]}
										value={inputValues[filter]}
										onChange={handleChangeFilterWithValues(filter)}
									/>
								) : (
									<Switch
										key={filter}
										checked={isChecked[filter]}
										onChange={handleChangeFilter(filter)}
									/>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</form>
	);
};

export default Filters;
