const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client.js'));
});

app.get('/lobby.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});


const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws, req) => {
    const roomID = req.url.slice(1);

    if (!rooms[roomID]) {
        rooms[roomID] = new Set();
    }
    rooms[roomID].add(ws);

    ws.on('message', (message) => {
        rooms[roomID].forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        rooms[roomID].delete(ws);
        if (rooms[roomID].size === 0) {
            delete rooms[roomID];
        }
    });
});

server.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
