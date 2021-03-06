import React, { Component } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/CallEnd";

import "./index.css";

export default class Video extends Component {
	constructor(props) {
		super(props);
		this.useStyles = makeStyles({
			root: {
				maxWidth: 500,
			},
			media: {
				height: 250,
			},
		});
		this.connection = {};
		this.state = {};
		this.DOM = {
			localVideo: null,
			remoteVideo: null,
		};
		this.connection.connectedUser = null;
		this.connection.yourConn = null;
		this.connection.stream = null;
		this.connection.RTCPeerConnectionConfiguration = {
			iceServers: [],
		};
		this.connection.ws = props.websocket;
		this.connection.ws.onmessage = (msg) => {
			console.log("Got message", msg.data);
			let data = JSON.parse(msg.data);
			switch (data.type) {
				case "offer-video":
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
		this.connection.ws.addEventListener("error", (err) =>
			console.error("Got error", err)
		);
	}
	//alias for sending JSON encoded messages
	send(message) {
		//attach the other peer username to our messages
		if (this.connection.connectedUser) {
			message.name = this.connection.connectedUser;
		}
		this.connection.ws.send(JSON.stringify(message));
	}
	handleOffer(offer, name) {
		this.connection.connectedUser = name;
		this.initializePeerConnection().then(() => {
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
					console.error("error when creating answer:", error);
				}
			);
		});
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
		this.connection.connectedUser = null;
		this.setState({ remoteVideo: null });
		this.setState({ localVideo: null });
		this.connection.yourConn.close();
		this.clearLocalVideo();
		this.clearRemoteVideo();
		console.log("connection closed");
	}
	hangUp() {
		console.log("leave connection");
		this.send({
			type: "leave",
		});
		this.handleLeave();
		this.props.hangUp();
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
			console.log("create new connection");
			// Create the media stream
			navigator.mediaDevices
				.getUserMedia({
					video: true,
					audio: true,
				})
				.then((myStream) => {
					let stream = myStream;
					// displaying local video stream on the page
					// localVideo.srcObject = stream;
					this.setState({ localVideo: stream });
					this.setLocalVideo(stream);
					// create a new peer connection
					this.connection.yourConn = new RTCPeerConnection(
						this.RTCPeerConnectionConfiguration
					);
					// setup stream listening
					this.connection.yourConn.addStream(stream);
					// when a remote user adds stream to the peer connection, we display it
					this.connection.yourConn.onaddstream = (e) => {
						// remoteVideo.srcObject = e.stream;
						this.setState({ remoteVideo: e.stream });
						this.setRemoteVideo(e.stream);
					};
					// Setup ice handling
					this.connection.yourConn.onicecandidate = (event) => {
						if (event.candidate) {
							this.send({
								type: "candidate",
								candidate: event.candidate,
							});
						}
					};
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}
	call() {
		// lancer l'appel
		if (this.props.receive) {
            alert("reception");
            this.handleOffer(this.props.receive.offer, this.props.receive.name);
            return;
		}
		let callToUsername = this.props.called.telephone;
		if (
			this.props.user.telephone !== callToUsername &&
			callToUsername.length > 0
		) {
			this.connection.connectedUser = callToUsername;
			// if connection was previously closed, we create a new one
			this.initializePeerConnection()
				.then(() => {
					console.log("connection created");
					// create an offer
					this.connection.yourConn.createOffer(
						(offer) => {
							this.send({
								type: "offer-video",
								offer: offer,
							});
							this.connection.yourConn.setLocalDescription(offer);
						},
						(error) => {
							alert("Error when creating an offer");
							console.error("error when creating offer:", error);
						}
					);
				})
				.catch((error) => {
					console.error(error);
				});
		} else {
			this.initializePeerConnection().then(() => {
				console.log("connection initialisée");
			});
		}
	}
	setLocalVideo(stream) {
		this.DOM.localVideo.srcObject = stream;
	}
	setRemoteVideo(stream) {
		this.DOM.remoteVideo.srcObject = stream;
	}
	clearLocalVideo() {
		this.DOM.localVideo.srcObject = null;
	}
	clearRemoteVideo() {
		this.DOM.remoteVideo.srcObject = null;
	}
	componentDidMount() {
		this.call();
		this.DOM.remoteVideo = document.getElementById("remoteVideo");
		this.DOM.localVideo = document.getElementById("localVideo");
	}
	render() {
		return (
			<div className="card-video">
				<Card>
					<div className="testfin">
						<div id="callPage" className="call-page">
							<video id="localVideo" autoPlay />
							<video id="remoteVideo" autoPlay />
						</div>
					</div>

					<div id="callend">
						<CardActions id="callend">
							<IconButton
								color="secondary"
								aria-label="delete"
								size="medium"
								onClick={() => this.hangUp()}
							>
								<DeleteIcon fontSize="large" />
							</IconButton>
						</CardActions>
					</div>
				</Card>
			</div>
		);
	}
}
