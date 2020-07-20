const PORT = 9091;
const HOST = "localhost";
const MESSAGE_TYPE = {
	EXIT: "EXIT",
	LIST_CONTACTS: "LIST_CONTACTS",
	FIRST_CONTACT: "FIRST_CONTACT",
	LIST_MESSAGES: "LIST_MESSAGES",
	DISCUSSION: "DISCUSSION",
	INSERT_CONTACT: "INSERT_CONTACT",
	INSERT_MESSAGE: "INSERT_MESSAGE",
};

export class LocalDB {
	constructor() {
		const APP = this;
		this.resolve = null;
		this.reject = null;
		this.ws = new WebSocket("ws://" + HOST + ":" + PORT);
		this.ws.addEventListener("message", (event) => {
			console.log("message from server:");
			try {
				const answer = JSON.parse(event.data);
				console.log(answer);
				if (APP.resolve) APP.resolve(answer.data);
				APP.resolve = null;
			} catch (e) {
				console.error(e);
				if (APP.reject) APP.reject(e);
				this.reject = null;
			}
		});
	}
	getState() {
		return this.ws.readyState;
	}
	send(msg, onresolve, onreject) {
		// const APP = this;
		console.log(`sending "${msg}"...`);
		this.resolve = (params) => {
			if (onresolve) onresolve(params);
		};
		this.reject = (params) => {
			if (onreject) onreject(params);
		};
		this.ws.send(msg);
	}
	discussion(emit, recv, resolve, reject) {
		if (this.ws.readyState === WebSocket.CONNECTING) {
			// this.scheduller(this.listContacts, resolve, reject);
			return;
		}
		this.send(
			JSON.stringify({
				type: MESSAGE_TYPE.DISCUSSION,
				params: {
					emit: emit,
					recv: recv,
				},
			}),
			resolve,
			reject
		);
	}
	listContacts(resolve, reject) {
		if (this.ws.readyState === WebSocket.CONNECTING) {
			// this.scheduller(this.listContacts, resolve, reject);
			return;
		}
		this.send(
			JSON.stringify({
				type: MESSAGE_TYPE.LIST_CONTACTS,
			}),
			resolve,
			reject
		);
	}
	listMessages() {
		if (this.ws.readyState === WebSocket.CONNECTING) {
			// this.scheduller(this.listContacts, resolve, reject);
			return;
		}
		this.send(
			JSON.stringify({
				type: MESSAGE_TYPE.LIST_MESSAGES,
				params: {
					emit: document.getElementById("emit-list").value,
					recv: document.getElementById("recv-list").value,
					date: document.getElementById("date-list").value,
					type: document.getElementById("type-list").value,
				},
			})
		);
	}
	insertMessage(emit, recv, type, content) {
		if (this.ws.readyState === WebSocket.CONNECTING) {
			// this.scheduller(this.listContacts, resolve, reject);
			return;
		}
		console.log({
			emit: emit,
			recv: recv,
			date: new Date()
				.toISOString()
				.replace(/T/, " ")
				.replace(/\..+/, ""),
			type: type,
			content: content,
		});
		this.send(
			JSON.stringify({
				type: MESSAGE_TYPE.INSERT_MESSAGE,
				params: {
					emit: emit,
					recv: recv,
					date: new Date()
						.toISOString()
						.replace(/T/, " ")
						.replace(/\..+/, ""),
					type: type,
					content: content,
				},
			})
		);
	}
	scheduller(callback, ...params) {
		this.ws.onopen = () => {
			callback(...params);
		};
	}
}
