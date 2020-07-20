import React from "react";
import Compose from "../Compose";
import Toolbar from "../Toolbar";
import ToolbarButton from "../ToolbarButton";
import Message from "../Message";
import moment from "moment";
import audio_call_image from "../../assets/images/tools/audio_call.png";
import video_call_image from "../../assets/images/tools/video_call.png";

import "./MessageList.css";

const MY_USER_ID = "apple";

export default class MessageList extends React.Component {
	constructor(props) {
		super(props);
		this.state = { messages: [], activeDataChannel: true };
		this.state.endMessageResolve = null;
		this.state.endMessageReject = null;
	}
	leaveMessage() {
		this.setState({
			activeDataChannel: false,
			// endMessageResolve: resolve,
			// endMessageReject: reject,
		});
		// return new Promise((resolve, reject) => {
		// 	this.setState({
		// 		activeDataChannel: false,
		// 		endMessageResolve: resolve,
		// 		endMessageReject: reject,
		// 	});
		// });
	}
	componentDidUpdate() {
		const messageList = this;
		if (this.props.actif) {
			console.log("historique des messages");
			this.props.localDB.discussion(
				this.props.user.telephone,
				this.props.actif.telephone,
				(msgs) => {
					msgs = msgs.map((msg, index) => {
						return {
							id: index,
							author:
								msg.emetteur === this.props.user.telephone
									? MY_USER_ID
									: "orange",
							message: msg.content,
							timestamp: msg.date,
						};
					});
					const messages = msgs.slice();
					console.log("liste des messages :", messages);
					messageList.setState({ messages: messages });
				},
				(err) => {
					console.log(err);
				}
			);
		}
	}

	render() {
		const messages = this.state.messages;

		const renderMessages = () => {
			let i = 0;
			let messageCount = messages.length;
			let tempMessages = [];

			while (i < messageCount) {
				let previous = messages[i - 1];
				let current = messages[i];
				let next = messages[i + 1];
				let isMine = current.author === MY_USER_ID;
				let currentMoment = moment(current.timestamp);
				let prevBySameAuthor = false;
				let nextBySameAuthor = false;
				let startsSequence = true;
				let endsSequence = true;
				let showTimestamp = true;

				if (previous) {
					let previousMoment = moment(previous.timestamp);
					let previousDuration = moment.duration(
						currentMoment.diff(previousMoment)
					);
					prevBySameAuthor = previous.author === current.author;

					if (prevBySameAuthor && previousDuration.as("hours") < 1) {
						startsSequence = false;
					}

					if (previousDuration.as("hours") < 1) {
						showTimestamp = false;
					}
				}

				if (next) {
					let nextMoment = moment(next.timestamp);
					let nextDuration = moment.duration(nextMoment.diff(currentMoment));
					nextBySameAuthor = next.author === current.author;

					if (nextBySameAuthor && nextDuration.as("hours") < 1) {
						endsSequence = false;
					}
				}

				tempMessages.push(
					<Message
						key={i}
						isMine={isMine}
						startsSequence={startsSequence}
						endsSequence={endsSequence}
						showTimestamp={showTimestamp}
						data={current}
					/>
				);

				// Proceed to the next message.
				i += 1;
			}

			return tempMessages;
		};
		return (
			<div className="message-list">
				<Toolbar
					title={
						this.props.actif
							? this.props.actif.username
							: this.props.user.username
					}
					rightItems={[
						<ToolbarButton
							key="audio"
							rtc={this.state.activeDataChannel}
							icon={audio_call_image}
							call={this.props.audioCall}
							leaveMessage={() => this.leaveMessage()}
						/>,
						<ToolbarButton
							key="video"
							rtc={this.state.activeDataChannel}
							icon={video_call_image}
							call={this.props.videoCall}
							leaveMessage={() => this.leaveMessage()}
						/>,
					]}
				/>

				<div className="message-list-container">{renderMessages()}</div>

				<Compose
					sendMessage={this.props.sendMessage}
					getMessage={this.props.getMessage}
					connection={this.props.connection}
					actif={this.props.actif}
					user={this.props.user}
					activeDataChannel={this.state.activeDataChannel}
					status={this.state.status}
					// endMessageResolve={() => this.state.endMessageResolve()}
					// endMessageReject={() => this.state.endMessageReject()}
					rightItems={[
						<ToolbarButton key="photo" icon="ion-ios-camera" />,
						<ToolbarButton key="image" icon="ion-ios-image" />,
						<ToolbarButton key="audio" icon="ion-ios-mic" />,
						<ToolbarButton key="money" icon="ion-ios-card" />,
						<ToolbarButton key="games" icon="ion-logo-game-controller-b" />,
						<ToolbarButton key="emoji" icon="ion-ios-happy" />,
					]}
				/>
			</div>
		);
	}
}
