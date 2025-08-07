<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'

//const socket = io('http://localhost:3000')
const socket = io('https://community-sample-v2-production.up.railway.app/')
const ROLE = 'master';
const isRecording = ref(false);

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎛️ Master connesso:', socket.id)
  })
  socket.on('new_player', (id) => {
    console.log('nuovo player connesso:', id)
  })

})

const starRecording = () => {
  isRecording.value = true;
  socket.emit('start_jam')
}

const stopRecording = () => {
  isRecording.value = false;
  socket.emit('stop_jam')
}


</script>

<template>
  <div class="flex w-full h-[100vh] justify-center items-center flex-col">
    <h1 class="text-white text-4xl">🎛️ Master Page</h1>
    <button @click="starRecording" v-if="!isRecording" class="text-xl text-white bg-green-500 p-4 rounded-4xl my-4">start</button>
    <button @click="stopRecording" v-else class="text-xl text-white bg-red-500 p-4 rounded-4xl my-4">stop</button>
  </div>
</template>
