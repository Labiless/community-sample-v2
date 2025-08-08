<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import QrcodeVue from 'qrcode.vue';

//const URL = import.meta.env.SOCKET_URL
const qrCodeUrl = 'https://community-sample-v2-production.up.railway.app/player';
//const socket = io("http://localhost:3000")
const socket = io('https://community-sample-v2-production.up.railway.app/')
const ROLE = 'master';
const isRecording = ref(false);
const finalTrack = ref(null);

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎛️ Master connesso:', socket.id)
  })
  socket.on('new_player', (id) => {
    console.log('nuovo player connesso:', id)
  })
  socket.on('final_track', ({ masterId, wav }) => {
    const blob = new Blob([wav], { type: 'audio/wav' });
    finalTrack.value = URL.createObjectURL(blob);
  });
})

const starRecording = () => {
  isRecording.value = true;
  socket.emit('start_jam')
}

const stopRecording = () => {
  isRecording.value = false;
  socket.emit('stop_jam')
}
const mixTrack = () => {
  socket.emit('mix_track')
}

</script>

<template>
  <div class="flex w-full h-[100vh] justify-center items-center flex-col">
    <h1 class="text-white text-4xl">🎛️ Master Page</h1>
    <QrcodeVue class="m-4" :value="qrCodeUrl" :size="250" level="L" />
    <button @click="starRecording" v-if="!isRecording"
      class="text-xl text-white bg-green-500 p-4 rounded-4xl my-4">start</button>
    <button @click="stopRecording" v-else class="text-xl text-white bg-red-500 p-4 rounded-4xl my-4">stop</button>
    <button @click="mixTrack" class="text-xl text-white bg-orange-500 p-4 rounded-4xl my-4">mix track</button>
    <audio controls v-if="finalTrack" :src="finalTrack"></audio>
  </div>
</template>
