<script setup>
import { onMounted } from "vue";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// ⚠️ Qui scegli se sei master o player (può arrivare da URL, login, ecc.)
const role = "player"; // oppure "master"

onMounted(() => {
  socket.on("connect", () => {
    console.log("🔌 Connesso:", socket.id);
    socket.emit("set_role", role);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnesso");
  });
});
</script>

<template>
  <h1>👥 Ruolo: {{ role }}</h1>
</template>
