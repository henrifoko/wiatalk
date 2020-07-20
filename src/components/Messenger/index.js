import React from "react";
import ConversationList from "../ConversationList";
import MessageList from "../MessageList";
import "./Messenger.css";

export default function Messenger(props) {
	return (
		<div className="messenger">
			{/* <Toolbar
          title="Messenger"
          leftItems={[
            <ToolbarButton key="cog" icon="ion-ios-cog" />
          ]}
          rightItems={[
            <ToolbarButton key="add" icon="ion-ios-add-circle-outline" />
          ]}
        /> */}

			{/* <Toolbar
          title="Conversation Title"
          rightItems={[
            <ToolbarButton key="info" icon="ion-ios-information-circle-outline" />,
            <ToolbarButton key="video" icon="ion-ios-videocam" />,
            <ToolbarButton key="phone" icon="ion-ios-call" />
          ]}
        /> */}

			<div className="scrollable sidebar">
				<ConversationList
					localDB={props.localDB}
					contacts={props.contacts}
					actif={props.actif}
					onActiveChange={props.onActiveChange}
				/>
			</div>

			<div className="scrollable content">
				<MessageList
					actif={props.actif}
					user={props.user}
					localDB={props.localDB}
                    sendMessage={props.sendMessage}
                    getMessage={props.getMessage}
                    videoCall={props.videoCall}
                    audioCall={props.audioCall}
                    connection={props.connection}
                    status={props.status}

				/>
			</div>
		</div>
	);
}
