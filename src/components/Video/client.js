//our username 
var name;
var connectedUser;

//connecting to our signaling server
var ws = new WebSocket('ws://192.168.137.1:9090');

ws.onopen = function () {
    console.log("Connected to the signaling server");
};

//when we got a message from a signaling server 
ws.onmessage = function (msg) {
    console.log("Got message", msg.data);

    let data = {};
    try {
        data = JSON.parse(msg.data);
    } catch {
        return;
    }

    switch (data.type) {
        case "login":
            handleLogin(data.success);
            break;
            //when somebody wants to call us 
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
            //when a remote peer sends an ice candidate to us 
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }
};

ws.addEventListener(
    'error', err => console.error("Got error", err));

//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages 
    if (connectedUser) {
        message.name = connectedUser;
    }

    ws.send(JSON.stringify(message));
};

//****** 
//UI selectors block 
//******

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;
var RTCPeerConnectionConfiguration = {
    "iceServers": []
};

callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", event => {
    name = usernameInput.value;

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }

});

function handleLogin(success) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //initialize a new peer connection
        initializePeerConnection();
    }
}

//initiating a call 
callBtn.addEventListener("click", () => {
    let callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {

        connectedUser = callToUsername;

        //if connection was previously closed, we create a new one
        initializePeerConnection().then(() => {
            console.log('connection created');
            // create an offer 
            yourConn.createOffer(offer => {
                send({
                    type: "offer",
                    offer: offer
                });
    
                yourConn.setLocalDescription(offer);
            }, error => {
                alert("Error when creating an offer");
                console.error('error when creating offer:', error);
            });
        }).catch(error => {
            console.error(error);
        });
    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    connectedUser = name;
    initializePeerConnection().then(() => {
        yourConn.setRemoteDescription(new RTCSessionDescription(offer));

        //create an answer to an offer 
        yourConn.createAnswer(answer => {
            yourConn.setLocalDescription(answer);

            send({
                type: "answer",
                answer: answer
            });

        }, error => {
            alert("Error when creating an answer");
            console.error('error when creating answer:', error);
        });
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", () => {

    send({
        type: "leave"
    });

    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.srcObject = null;

    yourConn.close();
    console.log('connection closed');
    // yourConn.onicecandidate = null;
    // yourConn.onaddstream = null;
};

function initializePeerConnection() {
    return new Promise((resolve, reject) => {
        if (yourConn &&
            yourConn.connectionState !== "closed" &&
            yourConn.connectionState !== "failed") {
                console.warn(
                    'Warning. The current connection is not closed');
                resolve();
                return;
            }
    
        console.log('create new connection');
        //Create the media stream
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(myStream => {
            stream = myStream;
    
            //displaying local video stream on the page 
            localVideo.srcObject = stream;
    
            //create a new peer connection
            yourConn = new RTCPeerConnection(RTCPeerConnectionConfiguration);
    
            // setup stream listening 
            yourConn.addStream(stream);
    
            //when a remote user adds stream to the peer connection, we display it 
            yourConn.onaddstream = e => {
                remoteVideo.srcObject = e.stream;
            };
    
            // Setup ice handling 
            yourConn.onicecandidate = event => {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }
            };
            resolve();
        }).catch(error => {
            reject(error);
        });
    });
}
