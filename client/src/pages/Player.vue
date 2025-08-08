<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import { Howl } from 'howler'

// CHANGE IN PROD
//const socket = io("http://localhost:3000")
const socket = io('communitysample.up.railway.app')

const ROLE = 'player';

let socketId = null;
let mediaRecorder = null;
let sampleBlob = null;
let jamBlob = null;
let sampleAudioChunks = [];
let jamAudioChunks = [];
let audioContext = null;
let destination = null;
let recorderGainNode = null;

let pressTimer = null;
let interval = null;

const recordedAudio = ref(null);
const isRecording = ref(false)
let samplePlayer = ref(null);
const isJamming = ref(false);
const longPressTriggered = ref(false);
const clicked = ref(false);
const isMic = ref(false);

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎹 Player connesso:', socket.id)
    socketId = socket.id
  })

  socket.on('start_jam', () => {
    startJam();
  });

  socket.on('stop_jam', () => {
    stopJam();
  })
})

const askForMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    isMic.value = true;
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    sampleAudioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        sampleAudioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      sampleBlob = new Blob(sampleAudioChunks, { type: 'audio/wav' })
      recordedAudio.value = URL.createObjectURL(sampleBlob)

      if (samplePlayer.value) {
        samplePlayer.value.unload() // distrugge il precedente
      }

      samplePlayer.value = new Howl({
        src: [recordedAudio.value],
        format: ['wav'],
        html5: true // utile per compatibilità mobile
      })
      stream.getTracks().forEach(track => track.stop())
      isRecording.value = false
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch (err) {
    console.error('🎙️ Errore microfono:', err)
    alert('Errore nell’accesso al microfono.')
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false
  }
}

const playSample = () => {
  if (samplePlayer.value) {
    samplePlayer.value.stop()
    samplePlayer.value.seek(0.2)
    samplePlayer.value.play()
    console.log('▶️ Playback Howler')
  }
}

const handleMouseDown = () => {
  clicked.value = true;
  longPressTriggered.value = false
  pressTimer = setTimeout(() => {
    if(samplePlayer.value && samplePlayer.value.playing()){
      samplePlayer.value.stop()
    }
    startRecording()
    longPressTriggered.value = true
  }, 700)
}

const handleMouseUp = () => {
  clicked.value = false;
  clearTimeout(pressTimer);
  if (longPressTriggered.value) {
    longPressTriggered.value = false
    clearInterval(interval)
    stopRecording()
  } else {
    playSample()
  }
}

const startJam = () => {

  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  recorderGainNode = audioContext.createGain()
  destination = audioContext.createMediaStreamDestination()

  const node = samplePlayer.value._sounds[0]._node
  const source = audioContext.createMediaElementSource(node)

  source.connect(recorderGainNode)
  recorderGainNode.connect(audioContext.destination)
  recorderGainNode.connect(destination)

  // MediaRecorder per registrare lo stream
  mediaRecorder = new MediaRecorder(destination.stream)

  jamAudioChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) {
      jamAudioChunks.push(e.data)
    }
  }
  mediaRecorder.onstop = () => {
    jamBlob = new Blob(jamAudioChunks, { type: 'audio/wav' })
    //recordedAudio.value = URL.createObjectURL(jamBlob);
    sendAudioToServer();
  }

  mediaRecorder.start()
  isJamming.value = true;

}

const stopJam = () => {
  isJamming.value = false;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
}

const sendAudioToServer = async () => {
  socket.emit('send-audio', {
    sender: socketId,
    buffer: await jamBlob.arrayBuffer()
  })
}
</script>

<template>
  <div v-if="!isMic" class="absolute left-0 top-0 w-full h-[100vh] bg-black text-white flex justify-center">
    <button @click="askForMic">Clicca qui per attivare il microfono</button>
  </div>
  <div :class="isJamming ? 'gradient-bg' : 'bg-transparent'"
    class="flex w-full h-[100vh] justify-center items-center flex-col">
    <p class="font-bold text-white mb-8">COMMUNITY SAMPLE</p>
    <button @mousedown="handleMouseDown" @mouseup="handleMouseUp" @touchstart.prevent="handleMouseDown"
      @touchend.prevent="handleMouseUp" class="w-44 h-44 rounded-3xl text-white text-lg duration-300"
      :class="isRecording ? 'bg-red-600 pulse rounded-full' : 'bg-green-600 rounded-3xl', clicked ? 'scale-110 shadow' : ''">
      <p v-if="isRecording" class="relative m-auto bg-white w-16 h-16 rounded-full text-6xl"></p>
      <p v-if="samplePlayer && !isRecording" class="left-1 relative text-6xl">▶</p>
    </button>
    <audio controls v-if="false" :src="recordedAudio"></audio>
  </div>
</template>

<style>

.pulse {
  --scale: 1.1;        /* quanto ingrandire (1.1 = +10%) */
  --duration: 1.5s;    /* durata di un ciclo */
  animation: pulse var(--duration) ease-in-out infinite;
  transform-origin: center;
  will-change: transform;
}

@keyframes pulse {
  0%, 100% { transform: scale(0.9); }
  50%      { transform: scale(var(--scale)); }
}

.shadow{
  box-shadow: 0px 0px 70px rgb(1, 141, 255);
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