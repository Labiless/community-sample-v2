<script setup>
import { onMounted } from 'vue'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

const ROLE = 'master';

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎛️ Master connesso:', socket.id)
  })
})
</script>

<template>
  <h1>🎛️ Master Page</h1>
</template>
