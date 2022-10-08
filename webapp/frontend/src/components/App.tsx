// ------------ Packages ------------
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ------------ Components ------------
import Music from "./Music";
import Login from "./Login";

// ------------ CSS Files ------------
import "../css/App.css";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="login" element={<Login />} />
				<Route index element={<Music />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
