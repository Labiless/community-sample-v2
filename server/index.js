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

// paths
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})
app.get('/player', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

//websocket
let playersId = [];
let masterId = undefined;

const PLAYER_ROLE = "player";
const MASTER_ROLE = "master";

io.on("connection", (socket) => {

  // Client invia il proprio ruolo subito dopo la connessione
  socket.on("set_role", (role) => {
    if (role === PLAYER_ROLE) {
      playersId.push(socket.id);
      io.to(masterId).emit('new_player', socket.id)
      console.log(`🎭 Nuovo player:`, socket.id);
    }

    if (role === MASTER_ROLE) {
      masterId = socket.id;
      console.log(`🎭 Master connesso`);
    }
  });

  socket.on('start_jam', () => {
    playersId.forEach(socketId => {
      io.to(socketId).emit('start_jam')
    })
  })

  socket.on('stop_jam', () => {
    playersId.forEach(socketId => {
      io.to(socketId).emit('stop_jam')
    })
  })

  socket.on('send-audio', data => {
    const { filename, buffer } = data

    // Salva il file sul disco
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(__dirname, 'uploads', filename)

    fs.writeFile(filePath, Buffer.from(buffer), err => {
      if (err) {
        console.error('Errore salvataggio audio:', err)
      } else {
        console.log('✅ Audio ricevuto e salvato in:', filePath)
      }
    })
  })

  socket.on("disconnect", () => {
    if (socket.id === masterId) {
      masterId = undefined;
      console.log("❌ Disconnesso il master");
      return;
    }
    playersId = playersId.filter(item => item !== socket.id);
    console.log("❌ Disconnesso il player:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
