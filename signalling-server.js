// signaling-server.js
const WebSocket = require('ws');
const port = 3000;

const wss = new WebSocket.Server({ port });

wss.on('connection', (ws) => {
  console.log('New connection established');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received message:', data);

    // Broadcast the message to all clients except the sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });
});

console.log(`Signaling server running on ws://localhost:${port}`);
