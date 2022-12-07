// ------------ Packages ------------
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ------------ Components ------------
import Music from "./Music";
import Login from "./Login";
import Brasilboard from "./Brasilboard";
import LevelBoard from "./LevelBoard";

// ------------ CSS Files ------------
import "../dev/css/App.css";

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
	);
};

export default App;
