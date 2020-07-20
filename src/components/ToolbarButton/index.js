import React from "react";
import "./ToolbarButton.css";
import { render } from "react-dom";

export default class ToolbarButton extends React.Component {
	handleClick(e) {
		if (this.props.rtc) this.props.leaveMessage();
		// alert("OK");
		if (this.props.call) this.props.call();
	}
	render() {
		const { icon } = this.props;
		return (
			<div className="icon-container" onClick={(e) => this.handleClick(e)}>
				<img src={`${icon}`} className="my-icon" alt="" />
			</div>
		);
	}
}
