import "../css/Login.css";

const Login = () => {
	window.onload = () => {
		if (localStorage.getItem("access_token")) return window.location.replace("/");
	};
	const handleLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		window.location.replace(
			"https://discord.com/api/oauth2/authorize?client_id=1028294291698765864&redirect_uri=https%3A%2F%2Fmusic.afterlifehorizon.net%2F&response_type=code&scope=identify"
		);
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
