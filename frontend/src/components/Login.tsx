import "../css/Login.css";

const Login = () => {
	window.onload = () => {
		if (localStorage.getItem("access_token")) return window.location.replace("/");
	};
	const handleLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		window.location.replace(import.meta.env.VITE_DISCORD_LOGIN_URL);
	};
	return (
		<div className="discord-login">
			<button onClick={handleLogin} className="blue-button">
				Login with Discord
			</button>
		</div>
	);
};

export default Login;
