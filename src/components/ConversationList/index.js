import React, { useState, useEffect } from "react";
import ConversationSearch from "../ConversationSearch";
import ConversationListItem from "../ConversationListItem";
import Toolbar from "../Toolbar";
// import ToolbarButton from "../ToolbarButton";
import axios from "axios";
import profil_photo0 from "../../assets/images/users/user0.png";

import "./ConversationList.css";
import { createPortal } from "react-dom";

let profil_images = [profil_photo0];

export default function ConversationList(props) {
	let [conversations] = useState([]); // [conversations, setConversations]
	let discussions = [];
	if (props.contacts) {
		discussions = props.contacts.map((contact) => {
			return {
				photo: profil_images[parseInt(Math.random() * profil_images.length)],
				name: contact.username,
				text: "hello ! there I am using WiaTalk chat application !",
			};
		});
		conversations = discussions.slice();
	}
	useEffect(() => {
		getConversations();
	}, []);

	const getConversations = () => {
		// console.log(listContacts());
		// let randInt = parseInt(Math.random() * 10);
		// axios.get("https://randomuser.me/api/?results=20").then((response) => {
		// 	let newConversations = response.data.results.map((result) => {
		// 		return {
		// 			photo: profil_images[parseInt(Math.random() * profil_images.length)],
		// 			name: `henri Vallant Foko`,
		// 			text: "hello ! there I am using WiaTalk chat application !",
		// 		};
		//     });
		// 	setConversations([...conversations, ...newConversations, ...discussions]);
		// });
    };
	return (
		<div className="conversation-list">
			<Toolbar
				title="Discussions"
				// leftItems={[<ToolbarButton key="cog" icon="ion-ios-cog" />]}
				// rightItems={[
				// 	<ToolbarButton key="add" icon="ion-ios-add-circle-outline" />,
				// ]}
			/>
			<ConversationSearch />
			{conversations.map((conversation, index) => (
				<ConversationListItem
					key={conversation.name}
					data={conversation}
					contact={props.contacts[index]}
					actif={
						props.actif
							? props.contacts[index].telephone === props.actif.telephone
							: false
					}
					onActiveChange={props.onActiveChange}
				/>
			))}
		</div>
	);
}
