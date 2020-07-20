import React, { useEffect } from "react";
import shave from "shave";

import "./ConversationListItem.css";

export default class ConversationListItem extends React.Component {
	constructor(props) {
        super(props);
        this.handleClick.bind(this);
        this.changeActive = props.onActiveChange;
        this.contact = props.contact;
	}
	handleClick(e) {
        console.log(`click sur '${this.props.data.name}'`);
        this.changeActive(this.contact);
    }
	render() {
		// useEffect(() => {
		// 	shave(".conversation-snippet", 20);
		// });

        const { photo, name, text } = this.props.data;
        
		return (
			<div
				className={"conversation-list-item "+ (this.props.actif?'actif':'')}
                onClick={(e) => {this.handleClick(e)}}>
				<img className="conversation-photo" src={photo} alt="conversation" />
				<div className="conversation-info">
					<h1 className="conversation-title">{name}</h1>
					<p className="conversation-snippet">{text}</p>
				</div>
			</div>
		);
	}
}
