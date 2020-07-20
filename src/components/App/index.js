import React from "react";
import Messenger from "../Messenger";
import { LocalDB } from "../../utils/utils";
import Video from "../Video";
import Audio from "../Audio";
import "../../config/signaling";
import UserConfig from "../../config/user";
import ServerConfig from "../../config/signaling";

const USER = {
	telephone: UserConfig.telephone,
	username: UserConfig.username,
	email: UserConfig.email,
};

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.db = {};
		this.state = {};
		this.connection = {};
		this.db.localDB = new LocalDB();
		this.state = {
			contacts: null,
			actif: USER,
			user: USER,
			status: null,
		};
		this.createConnection()
			.then((ws) => {
				console.log("WebSocket created with success");
				this.connection.ws = ws;
				this.connection.ws.onmessage = (msg) => {
					console.log("Got message", msg.data);
					let data = {};
					try {
						data = JSON.parse(msg.data);
					} catch {
						return;
					}
					switch (data.type) {
						case "login":
							this.handleLogin(data.success);
							break;
						default:
							break;
					}
				};
				this.connection.ws.addEventListener("error", (err) =>
					console.error("Got error", err)
				);
				this.connection.ws.addEventListener("close", () => {
					console.log("connection to the signaling server closed");
				});
				this.startLogin();
			})
			.catch((_) => {
				console.error("error when creating the WebSocket");
				alert(
					"You are not logged to the signaling server, " +
						"Please try reload the page."
				);
			});
		this.sendMessage.bind(this);
		this.changeActif.bind(this);
	}
	createConnection() {
		return new Promise((resolve, reject) => {
			let ws = null;
			ws = new WebSocket(`ws://${ServerConfig.HOST}:${ServerConfig.PORT}`);
			ws.addEventListener("open", () => {
				resolve(ws);
			});
			ws.addEventListener("error", (err) => {
				reject(err);
			});
		});
	}
	startLogin() {
		console.log("connection to the WebSocket...");
		let name = this.state.user.telephone;
		if (name.length > 0) {
			this.connection.timeOutId = setTimeout(() => this.firtSend(name), 500);
		}
	}
	handleLogin(success) {
		if (success === false) {
			alert("Ooops...try a different phone number");
		} else {
			console.log("connection successfully created to the signaling server");
			this.connection.logged = true;
		}
	}
	send(message) {
		this.connection.ws.send(JSON.stringify(message));
	}
	firtSend(name) {
		console.log("connection established with the WebSocket");
		this.send({
			type: "login",
			name: name,
		});
	}
	changeActif(contact) {
		this.setState({ actif: contact });
	}
	sendMessage(msg) {
		console.log("enregistrement du message:", msg);
		// prétraitement du message
		while (msg.indexOf('"') !== -1) {
			msg = msg.replace('"', '\\"');
		}
		this.setState((state) => {
			this.db.localDB.insertMessage(
				state.user.telephone,
				state.actif.telephone,
				"TEXT",
				msg
			);
			const newState = { ...state };
			return newState;
		});
	}
	getMessage(msg, contact) {
		console.log("enregistrement du message:", msg);
		// prétraitement du message
		while (msg.indexOf('"') !== 1) {
			msg = msg.replace('"', '\\"');
		}
		this.setState((state) => {
			this.db.localDB.insertMessage(
                contact,
				state.user.telephone,
				"TEXT",
				msg
			);
			const newState = { ...state };
			return newState;
		});
	}
	videoCall() {
		if (this.connection.logged) {
			if (
				this.state.status !== "video-call" &&
				this.state.status !== "audio-call"
			) {
				this.setState({ status: "video-call" });
			} else {
				alert("You are already calling");
			}
		} else {
			alert("You are not logged");
		}
	}
	audioCall() {
		if (this.connection.logged) {
			if (
				this.state.status !== "video-call" &&
				this.state.status !== "audio-call"
			) {
				this.setState({ status: "audio-call" });
			} else {
				alert("You are already calling");
			}
		} else {
			alert("You are not logged");
		}
	}
	hangUp() {
        this.setState({ status: null });        
	}
	componentDidMount() {
		setTimeout(() => {
			this.db.localDB.listContacts((contacts) => {
				console.log(contacts);
				this.setState({ contacts });
			}); 
		}, 1000);
	}
	callPage() {
		switch (this.state.status) {
			case "video-call":
				return (
					<Video
						called={this.state.actif}
						user={this.state.user}
						hangUp={() => this.hangUp()}
						websocket={this.connection.ws}
					/>
				);
			case "audio-call":
				return (
					<Audio
						called={this.state.actif}
						user={this.state.user}
						hangUp={() => this.hangUp()}
						websocket={this.connection.ws}
					/>
				);
			default:
				break;
		}
	}
	render() {
		return (
			<div className="App">
				<Messenger
					localDB={this.db.localDB}
					contacts={this.state.contacts}
					actif={this.state.actif}
					user={this.state.user}
					onActiveChange={(contact) => this.changeActif(contact)}
					sendMessage={(m) => this.sendMessage(m)}
					getMessage={(m, c) => this.getMessage(m, c)}
					videoCall={() => this.videoCall()}
					audioCall={() => this.audioCall()}
					connection={this.connection}
                    status={this.state.status}
				/>
				{this.callPage()}
			</div>
		);
	}
}
