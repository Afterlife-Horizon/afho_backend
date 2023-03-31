import "../css/Login.css"
import { useNavigate } from "react-router-dom"
import useUser from "../hooks/useUser"
import { supabase } from "../utils/supabaseUtils"
import { Image } from "antd"

const Success = () => {
	const navigate = useNavigate()
	const { data: user, isLoading, error } = useUser()

	if (isLoading) return <div>Loading...</div>
	if (error) return <div>Error: {error.message}</div>

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut()
		if (error) return
		navigate("/login")
	}

	return (
		<div>
			<div>
				<h1>Success</h1>
				<div>
					<h2>Profile</h2>
					<div>
						<Image src={user?.user_metadata.avatar_url} />
						<p>{user?.email}</p>
						<p>{user?.user_metadata.full_name}</p>
						<button onClick={handleSignOut}>Sign out</button>

						<h2>Session</h2>
						<pre>{JSON.stringify(user, null, 2)}</pre>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Success
