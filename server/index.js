// server/index.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // in dev, da settare meglio in prod
  },
});


const distPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(distPath))

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.get('/player', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const socketRoles = {};

io.on("connection", (socket) => {
  console.log("🔌 Nuovo utente:", socket.id);

  // Client invia il proprio ruolo subito dopo la connessione
  socket.on("set_role", (role) => {
    socketRoles[socket.id] = role;
    console.log(`🎭 Socket ${socket.id} ha ruolo ${role}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnesso:", socket.id);
    delete socketRoles[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
