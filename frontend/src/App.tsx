// ------------ Packages ------------
import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

// ------------ Components ------------
import Music from "./components/Music"
import Login from "./components/Login"
import Brasilboard from "./components/Brasilboard"
import LevelBoard from "./components/LevelBoard"

// ------------ CSS Files ------------
import "./css/App.css"
import "./css/dark/App.css"

const App: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="login" element={<Login />} />
				<Route path="brasilboard" element={<Brasilboard />} />
				<Route path="levels" element={<LevelBoard />} />
				<Route index element={<Music />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
