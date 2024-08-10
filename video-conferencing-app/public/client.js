let localStream;
let remoteStream;
let peerConnection;
let signalingServerUrl = 'ws://localhost:3000'; // URL of the signaling server
let ws;

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user-1").srcObject = localStream;

  ws = new WebSocket(signalingServerUrl);

  ws.onmessage = async (message) => {
    try {
      // Check if the message data is a Blob, if so, read it as text
      let data;
      if (message.data instanceof Blob) {
        data = await message.data.text(); // Read Blob as text
      } else {
        data = message.data;
      }
  
      // Parse the data to JSON
      const parsedData = JSON.parse(data);
  
      if (parsedData.type === 'offer') {
        await handleOffer(parsedData.offer);
      } else if (parsedData.type === 'answer') {
        await handleAnswer(parsedData.answer);
      } else if (parsedData.type === 'candidate') {
        await handleCandidate(parsedData.candidate);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };
  

  ws.onopen = () => {
    console.log('Connected to signaling server');
    createOffer();
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
};

const createOffer = async () => {
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log("New ICE candidate:", event.candidate);
      ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
  };

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  ws.send(JSON.stringify({ type: 'offer', offer }));
  console.log("Offer sent:", offer);
};

const handleOffer = async (offer) => {
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log("New ICE candidate:", event.candidate);
      ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  ws.send(JSON.stringify({ type: 'answer', answer }));
};

const handleAnswer = async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

const handleCandidate = async (candidate) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

init();
