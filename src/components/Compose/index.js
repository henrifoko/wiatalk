import React from "react";
import "./Compose.css";

export default class Compose extends React.Component {
	constructor(props) {
		super(props);
		this.state = { value: "" };
		this.connection = { dataChannelInactive: false };
		this.connection.status = true;
		this.connection.connectedUser = null;
		this.connection.yourConn = null;
		this.connection.dataChannel = null;
		this.connection.calling = false;
		this.connection.RTCPeerConnectionConfiguration = {
			iceServers: [],
		};
		this.initConnection();
	}
	initConnection() {
		if (this.props.connection.ws) {
			this.connection.ws = this.props.connection.ws;
			this.connection.ws.onmessage = (msg) => {
				console.log("Got message", msg.data);
				let data = JSON.parse(msg.data);
				switch (data.type) {
					case "offer":
						this.handleOffer(data.offer, data.name);
						break;
					case "answer":
						this.handleAnswer(data.answer);
						break;
					case "candidate":
						this.handleCandidate(data.candidate);
						break;
					case "leave":
						this.handleLeave();
						break;
					default:
						break;
				}
			};
			this.connection.ws.onerror = function(err) {
				console.log("Got error", err);
			};
			this.call();
		} else {
			setTimeout(() => this.initConnection(), 250);
		}
	}
	send(message) {
		//attach the other peer username to our messages
		if (this.connection.connectedUser) {
			message.name = this.connection.connectedUser;
		}
		this.connection.ws.send(JSON.stringify(message));
	}
	handleOffer(offer, name) {
		this.connection.connectedUser = name;
		this.connection.yourConn.setRemoteDescription(
			new RTCSessionDescription(offer)
		);
		//create an answer to an offer
		this.connection.yourConn.createAnswer(
			(answer) => {
				this.connection.yourConn.setLocalDescription(answer);
				this.send({
					type: "answer",
					answer: answer,
				});
			},
			(error) => {
				alert("Error when creating an answer");
			}
		);
	}
	//when we got an answer from a remote user
	handleAnswer(answer) {
		this.connection.yourConn.setRemoteDescription(
			new RTCSessionDescription(answer)
		);
	}
	//when we got an ice candidate from a remote user
	handleCandidate(candidate) {
		this.connection.yourConn.addIceCandidate(new RTCIceCandidate(candidate));
	}
	handleLeave() {
		try {
			this.connection.connectedUser = null;
			this.connection.yourConn.close();
			this.connection.yourConn.onicecandidat = null;
			console.log("connection closed");
			this.props.endMessageResolve();
		} catch (e) {
			this.props.endMessageReject();
		}
	}
	initializePeerConnection() {
		return new Promise((resolve, reject) => {
			if (
				this.connection.yourConn &&
				this.connection.yourConn.connectionState !== "closed" &&
				this.connection.yourConn.connectionState !== "failed"
			) {
				console.warn("Warning. The current connection is not closed");
				resolve();
				return;
			}
			try {
				console.log("create new connection");
				this.connection.yourConn = new RTCPeerConnection(
					this.connection.RTCPeerConnectionConfiguration,
					{
						optional: [{ RtpDataChannels: true }],
					}
				);
				// Setup ice handling
				this.connection.yourConn.onicecandidate = (event) => {
					if (event.candidate) {
						this.send({
							type: "candidate",
							candidate: event.candidate,
						});
					}
				};
				//creating data channel
				this.connection.dataChannel = this.connection.yourConn.createDataChannel(
					"channel1",
					{ reliable: true }
				);
				this.connection.dataChannel.onerror = (error) => {
					console.log("Ooops...error:", error);
				};
				//when we receive a message from the other peer, display it on the screen
				this.connection.dataChannel.onmessage = (event) =>
					this.getMessage(event.data);
				this.connection.dataChannel.onclose = function() {
					console.log("data channel is closed");
				};
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}
	call() {
		let callToUsername = this.props.actif.telephone;
		if (
			callToUsername !== this.props.user.telephone &&
			callToUsername.length > 0
		) {
			this.calling = true;
			this.connection.connectedUser = callToUsername;
			this.initializePeerConnection()
				.then(() => {
					// create an offer
					this.connection.yourConn.createOffer(
						(offer) => {
							this.send({
								type: "offer",
								offer: offer,
							});
							this.connection.yourConn.setLocalDescription(offer);
						},
						(error) => {
							alert("Error when creating an offer");
						}
					);
				})
				.catch((err) => {
					console.error(err);
				});
		} else {
			this.initializePeerConnection().then(() => {
				console.log("connection initialisée");
			});
		}
	}
	getMessage(msg) {
		this.props.getMessage(msg, this.connection.connectedUser);
	}
	sendMessage(msg) {
		//sending a message to a connected peer
		if (
			this.connection.dataChannel &&
			this.connection.dataChannel.readyState === "open"
		) {
			this.connection.dataChannel.send(msg);
			this.props.sendMessage(msg);
		} else {
			alert("You are not connected with a peer user");
		}
	}
	hangUp() {
		this.send({
			type: "leave",
		});
		this.handleLeave();
	}
	changeValueHandler(e) {
		const target = e.target;
		const value = target.value;
		this.setState({ value: value });
	}
	keyPressHandler(event) {
		const key = "\n";
		if (event.ctrlKey && event.key === key && this.state.value.length > 0) {
			this.sendMessage(this.state.value);
			this.setState({ value: "" });
		}
	}
	componentDidUpdate() {
		this.call();
		// if (!this.props.activeDataChannel) {
		// 	if (!this.state.dataChannelInactive) {
		// 		this.hangUp();
		// 		this.connection.dataChannelInactive = true;
		// 	}
		// }
		// if (this.props.status == null) {
		// 	this.connection.status = true;
		// }
	}
	render() {
		return (
			<div className="compose" onKeyPress={(e) => this.keyPressHandler(e)}>
				<input
					type="text"
					className="compose-input"
					placeholder="Type a message, @name"
					onChange={(e) => {
						this.changeValueHandler(e);
					}}
					value={this.state.value}
				/>
				{this.props.rightItems}
			</div>
		);
	}
}
