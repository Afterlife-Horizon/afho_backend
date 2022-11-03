// ------------ Packages ------------
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ------------ Components ------------
import Music from "./Music";
import Login from "./Login";
import Brasilboard from "./Brasilboard";

// ------------ CSS Files ------------
import "../css/App.css";

const App: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="login" element={<Login />} />
				<Route path="brasilboard" element={<Brasilboard />} />
				<Route index element={<Music />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;
