import { Auth } from "@supabase/auth-ui-react"
import { supabase } from "../utils/supabaseUtils"

import "../css/Login.css"

const Login = () => {
	return (
		<div className="discord-login">
			<Auth
				supabaseClient={supabase}
				onlyThirdPartyProviders={true}
				redirectTo={import.meta.env.VITE_REDIRECT_URI}
				appearance={{
					className: {
						button: "blue-button",
						loader: "spinner"
					}
				}}
				providers={["discord"]}
			/>
		</div>
	)
}

export default Login
