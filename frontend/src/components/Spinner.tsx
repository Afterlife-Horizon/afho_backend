import React from "react"

interface IProps {
	small?: boolean
}

const Spinner: React.FC<IProps> = ({ small }) => {
	return (
		<div className="loader-container">
			<div className={`loader ${small ? "small-spinner" : "spinner"}`}></div>
		</div>
	)
}

export default Spinner
