<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import QrcodeVue from 'qrcode.vue';

const qrCodeUrl = 'communitysample.up.railway.app';

// CHANGE IN PROD
//const socket = io("http://localhost:3000")
const socket = io('communitysample.up.railway.app')

const ROLE = 'master';
const isRecording = ref(false);
const finalTrack = ref(null);
const isLoading = ref(false);

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
    isLoading.value = false;
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
  isLoading.value = true;
}

</script>

<template>
  <div class="flex w-full h-[100vh] justify-center items-center flex-col" :class="isRecording ? 'gradient-bg' : ''">
    <h1 class="text-white text-4xl font-black">COMMUNITY SAMPLE</h1>
    <QrcodeVue class="m-4" :value="qrCodeUrl" :size="250" level="L" />
    <div class="flex">
      <button @click="starRecording" v-if="!isRecording"
        class="text-xl font-bold uppercase text-white bg-green-500 p-4 rounded-4xl my-4">start</button>
      <button @click="stopRecording" v-else
        class="text-xl font-bold uppercase text-white bg-red-500 p-4 rounded-4xl my-4">stop</button>
      <button @click="mixTrack"
        class="text-xl font-bold uppercase text-white bg-orange-500 p-4 rounded-4xl my-4 ml-4">mix track</button>
    </div>
    <div v-if="isLoading" class="loading mt-4"></div>
    <audio controls v-if="finalTrack" :src="finalTrack"></audio>
  </div>
</template>

<style>
button {
  transition: all 0.3s;
}

button:hover {
  cursor: pointer;
  scale: 1.1;
}

.loading {
  width: 100px;
  height: 100px;
  background: #ff6900;
  animation: rotateAndRound 1s infinite linear;
}

@keyframes rotateAndRound {
  0% {
    transform: rotate(0deg);
    border-radius: 0;
  }

  50% {
    border-radius: 50%;
  }

  100% {
    transform: rotate(360deg);
    border-radius: 0;
  }
}

.gradient-bg {
	background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
	background-size: 500% 500%;
	animation: gradient 2s linear infinite;
} 

@keyframes gradient {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 300% 200%;
	}
	100% {
		background-position: 0% 50%;
	}
}


</style>