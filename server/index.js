// server/index.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { mixFilesToWav } = require('./mixer');
const path = require('path');
const fs = require('fs')
require("dotenv").config();

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
let audioTracksName = [];

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
    const { sender, buffer } = data
    const filePath = path.join(__dirname, 'uploads', `${sender}.wav`)

    audioTracksName.push(filePath);

    fs.writeFile(filePath, buffer, err => {
      if (err) {
        console.error('Errore salvataggio:', err)
      } else {
        console.log('✅ File audio salvato:', filePath)
      }
    })
    console.log("recived track from:", sender)
  })

  socket.on('mix_track', async (data) => {
    try {
      const finalTrack = await mixFilesToWav(audioTracksName);

      // Salvataggio su disco
      const outputPath = path.join(__dirname, 'uploads', `final.wav`);
      fs.writeFileSync(outputPath, finalTrack);
      io.to(masterId).emit('final_track', { masterId, wav: finalTrack });
      
      console.log(`Mix creato e inviato: ${outputPath}`);

    } catch (err) {
      console.error('Errore nel mix:', err);
    }
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
