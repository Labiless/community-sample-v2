<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import { Howl } from 'howler'

//const URL = import.meta.env.SOCKET_URL;
//const socket = io("http://localhost:3000")
const socket = io('https://community-sample-v2-production.up.railway.app/')
const ROLE = 'player';

let socketId = null;
let mediaRecorder = null;
let sampleBlob = null;
let jamBlob = null;
let sampleAudioChunks = [];
let jamAudioChunks = [];
let samplePlayer = null;
let audioContext = null;
let destination = null;
let recorderGainNode = null;

let pressTimer = null;
let longPressTriggered = false;
let interval = null;

const recordedAudio = ref(null);
const isRecording = ref(false)
const countdown = ref(0);
const isJamming = ref(false);

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

      if (samplePlayer) {
        samplePlayer.unload() // distrugge il precedente
      }

      samplePlayer = new Howl({
        src: [recordedAudio.value],
        format: ['wav'],
        html5: true // utile per compatibilità mobile
      })
      stream.getTracks().forEach(track => track.stop())
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
  if (samplePlayer) {
    samplePlayer.stop()
    samplePlayer.seek(0.2)
    samplePlayer.play()
    console.log('▶️ Playback Howler')
  }
}

const handleMouseDown = () => {
  longPressTriggered = false
  pressTimer = setTimeout(() => {
    interval = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value == 0) {
        startRecording()
        clearInterval(interval)
      }
    }, 700)
    longPressTriggered = true
    countdown.value = 3;
  }, 500)
}

const handleMouseUp = () => {
  clearTimeout(pressTimer);
  if (longPressTriggered) {
    countdown.value = 0;
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

  const node = samplePlayer._sounds[0]._node
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
  <div :class="isJamming ? 'bg-amber-600' : 'bg-transparent'"
    class="transition-all flex w-full h-[100vh] justify-center items-center flex-col">
    <button @mousedown="handleMouseDown" @mouseup="handleMouseUp" @touchstart.prevent="handleMouseDown"
      @touchend.prevent="handleMouseUp" class="w-50 h-50 rounded-full text-white text-lg transition duration-300"
      :class="isRecording ? 'bg-red-600' : 'bg-green-600'">
      <p v-if="countdown" class="bold text-8xl">{{ countdown }}</p>
    </button>
    <audio controls v-if="recordedAudio" :src="recordedAudio"></audio>
  </div>
</template>