<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')
const ROLE = 'player';

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎹 Player connesso:', socket.id)
  })
})
</script>

<template>
  <h1 class="text-4xl">🎹 Player Page</h1>
</template>
