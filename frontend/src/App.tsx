// ------------ Packages ------------
import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

// ------------ pages ------------
import Music from "./pages/Music"
import Login from "./pages/Login"
import Brasilboard from "./pages/Brasilboard"
import LevelBoard from "./pages/LevelBoard"
import Success from "./pages/Success"

// ------------ CSS Files ------------
import "./css/App.css"
import "./css/dark/App.css"

const App: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="login" element={<Login />} />
				<Route path="success" element={<Success />} />
				<Route path="brasilboard" element={<Brasilboard />} />
				<Route path="levels" element={<LevelBoard />} />
				<Route index element={<Music />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
