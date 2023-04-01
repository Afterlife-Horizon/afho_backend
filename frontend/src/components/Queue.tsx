// ------------ Packages ------------
import { Divider, Input } from "antd"
import React, { useContext, useState } from "react"
import axios from "axios"
import { Image } from "antd"

// ------------ CSS Files ------------
import "../css/Queue.css"
import "../css/dark/Queue.css"
import MusicContext from "../context/MusicContext"
import { supabase } from "../utils/supabaseUtils"

interface testCallback {
	(err: any, status: any, data: any): any
}

const Queue = () => {
	const {
		isSongRequester,
		queue,
		user,
		setInfo,
		setInfoboxColor,
		isAdding,
		setIsAdding,
		isAddingFirst,
		setIsAddingFirst,
		isShuffling,
		setIsShuffling,
		isClearing,
		setIsClearing
	} = useContext(MusicContext)

	const [page, setPage] = useState(1)
	if (!queue) return <div></div>
	let maxPage = queue.length > 6 ? Math.ceil((queue.length - 1) / 5) : -1
	if (page > maxPage + 2) setPage(maxPage + 2)
	else if (page !== 1 && queue.slice((page - 1) * 5 + 1, page * 5 + 1).length === 0) setPage(prev => prev - 1)
	let j = 0

	const [link, setLink] = useState("")

	const handleRemove = (id: number) => {
		return (_event: React.MouseEvent<HTMLButtonElement>) => {
			const remove = async (callback: testCallback) => {
				await axios
					.post(
						"/api/remove",
						{
							queuePos: id,
							access_token: (await supabase.auth.getSession()).data?.session?.access_token
						},
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

			if (!user?.isAdmin) {
				setInfo("You need to be admin!")
				return setInfoboxColor("orange")
			}

			if (!queue || queue.length === 0) {
				setInfo("No songs to remove!")
				return setInfoboxColor("orange")
			}
			remove((err, status, data) => {
				if (err) {
					if (status !== 500) setInfo(data)
					else setInfo("An error occured")
					setInfoboxColor("red")
					return console.error(err)
				}
				setInfo("Removed selected song!")
				setInfoboxColor("green")
			})
		}
	}

	const handleskipto = (id: number) => {
		return (event: React.MouseEvent<HTMLButtonElement>) => {
			const skipto = async (callback: testCallback) => {
				await axios
					.post(
						"/api/skipto",
						{
							queuePos: id,
							access_token: (await supabase.auth.getSession()).data?.session?.access_token
						},
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

			if (!user?.isAdmin) {
				setInfo("You need to be admin!")
				return setInfoboxColor("orange")
			}

			if (!queue || queue.length === 0) {
				setInfo("No songs to skipi to!")
				return setInfoboxColor("orange")
			}
			skipto((err, status, data) => {
				if (err) {
					if (status !== 500) setInfo(data)
					else setInfo("An error occured")
					setInfoboxColor("red")
					return console.error(err)
				}
				setInfo("Skiped to selected song!")
				setInfoboxColor("green")
			})
		}
	}

	const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsAdding(true)
		const addSong = async (callback: testCallback) => {
			await axios
				.post(
					"/api/play",
					{
						songs: link,
						access_token: (await supabase.auth.getSession()).data?.session?.access_token
					},
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

		if (link === "") {
			setIsAdding(false)
			setInfo("Please add a link or a song name before adding it!")
			return setInfoboxColor("orange")
		}
		addSong((err, status, data) => {
			setIsAdding(false)
			setLink("")
			if (err) {
				if (status !== 500) setInfo(data)
				else setInfo("An error occured")
				setInfoboxColor("red")
				return console.error(err)
			}
			setInfoboxColor("green")
			if (queue?.length === 0) return setInfo("Added to queue!")
			if (queue) setInfo("Added after " + queue[queue.length - 1].title)
		})
	}

	const handleAddFirst = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsAddingFirst(true)
		const AddFirst = async (callback: testCallback) => {
			await axios
				.post(
					"/api/playfirst",
					{
						songs: link,
						access_token: (await supabase.auth.getSession()).data?.session?.access_token
					},
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

		if (!queue || queue.length < 2) {
			setIsAddingFirst(false)
			setInfo('Please use "Add" button! There is no current queue!')
			return setInfoboxColor("orange")
		}
		if (link === "") {
			setIsAddingFirst(false)
			setInfo("Please add a link or a song name before adding it!")
			return setInfoboxColor("orange")
		}
		AddFirst((err, status, data) => {
			setLink("")
			if (err) {
				if (status !== 500) setInfo(data)
				else setInfo("An error occured")
				setInfoboxColor("red")
				return console.error(err)
			}
			setInfo("Added after current song!")
			setInfoboxColor("green")
		})
	}

	const handleShuffle = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsShuffling(true)
		const shuffleSongs = async (callback: testCallback) => {
			await axios
				.post("/api/shuffle", {
					access_token: (await supabase.auth.getSession()).data?.session?.access_token
				})
				.then(res => {
					callback(null, res.status, res.data)
				})
				.catch(err => {
					callback(err, err.response.status, err.response.data)
				})
		}

		if (!queue || queue.length < 3) {
			setIsShuffling(false)
			setInfo("No songs to shuffle!")
			return setInfoboxColor("orange")
		}
		shuffleSongs((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data)
				else setInfo("An error occured")
				setInfoboxColor("red")
				return console.error(err)
			}
			setInfo("Shuffled queue!")
			setInfoboxColor("green")
		})
	}

	const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		setIsClearing(true)
		const clearSongs = async (callback: testCallback) => {
			await axios
				.post("/api/clearqueue", {
					access_token: (await supabase.auth.getSession()).data?.session?.access_token
				})
				.then(res => {
					callback(null, res.status, res.data)
				})
				.catch(err => {
					callback(err, err.response.status, err.response.data)
				})
		}

		if (!user?.isAdmin) {
			setIsClearing(false)
			setInfo("You need to be admin!")
			return setInfoboxColor("orange")
		}

		if (!queue || queue.length < 2) {
			setIsClearing(false)
			setInfo("Nothing to clear!")
			return setInfoboxColor("orange")
		}
		clearSongs((err, status, data) => {
			if (err) {
				if (status !== 500) setInfo(data)
				else setInfo("An error occured")
				setInfoboxColor("red")
				return console.error(err)
			}
			setInfo("Cleared queue!")
			setInfoboxColor("green")
		})
	}

	let checkRequester = !user?.isAdmin && !isSongRequester

	return (
		<div className="queue">
			<div className="queue-adder">
				<Input placeholder="Song name / Link" className="queueInput" value={link} onChange={(event: any) => setLink(event.target.value)} />
				<button onClick={handleAdd} className={"next"}>
					{isAdding ? <div className="small-spinner"></div> : "ADD"}
				</button>
				<button onClick={handleAddFirst} className={"next"}>
					{isAddingFirst ? <div className="small-spinner"></div> : "ADD FIRST"}
				</button>
				<button disabled={!user?.isAdmin} onClick={handleShuffle} className={"next"}>
					{isShuffling ? <div className="small-spinner"></div> : "SHUFFLE"}
				</button>
				<button disabled={!user?.isAdmin} className="last-adder next" onClick={handleClear}>
					{isClearing ? <div className="small-spinner"></div> : "CLEAR"}
				</button>
			</div>
			{maxPage === -1 ? null : (
				<div className="queue-pages">
					<button onClick={() => setPage(1)}>{"|<<"}</button>
					<button onClick={() => setPage(prev => (prev > 1 ? prev - 1 : 1))}>{"<"}</button>
					<button onClick={() => setPage(prev => (prev < maxPage + 1 ? prev + 1 : maxPage + 1))}>{">"}</button>
					<button className="last-adder" onClick={() => setPage(maxPage + 1)}>
						{">>|"}
					</button>
				</div>
			)}
			<div>
				page: {page} / {maxPage === -1 ? 1 : maxPage}
			</div>
			<ul>
				{queue.slice((page - 1) * 5 + 1, page * 5 + 1).map(track => {
					j++
					return (
						<li className="queue-item" key={"queuedSong" + String((page - 1) * 5 + j)}>
							<div className="queue-list-item">
								<div>
									<button disabled={checkRequester} onClick={handleRemove((page - 1) * 5 + j)}>
										remove
									</button>
									<button disabled={!user?.isAdmin} onClick={handleskipto((page - 1) * 5 + j)}>
										skip to
									</button>
								</div>
								<div>
									<Image src={track.thumbnail.url} width={"10rem"} />
								</div>
								<div className="queue-item-name">
									<a href={"https://www.youtube.com/watch?v=" + track.id} target="_blank" rel="noopener noreferrer">
										{"  " + track.title}
									</a>
									<div className="requesterdiv">Requested by: {`${track.requester.username}`}</div>
								</div>
							</div>

							{j !== 5 ? <Divider /> : null}
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export default Queue
