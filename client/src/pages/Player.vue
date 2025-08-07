<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import { Howl } from 'howler'

const socket = io('http://localhost:3000')
const ROLE = 'player';

const recording = ref(false)
const recordedAudio = ref(null)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const pressTimer = ref(null)
const longPressTriggered = ref(false)
const audioInstance = ref(null)
const countdown = ref(0);
const interval = ref(null);
const samplePlayer = ref(null)

onMounted(() => {
  socket.on('connect', () => {
    socket.emit('set_role', ROLE)
    console.log('🎹 Player connesso:', socket.id)
  })
})

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    mediaRecorder.value = new MediaRecorder(stream)
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(audioChunks.value, { type: 'audio/wav' })
      recordedAudio.value = URL.createObjectURL(blob)

      // 🎧 Crea un nuovo Howl per riproduzione
      if (samplePlayer.value) {
        samplePlayer.value.unload() // distrugge il precedente
      }

      samplePlayer.value = new Howl({
        src: [recordedAudio.value],
        format: ['wav'],
        html5: true // utile per compatibilità mobile
      })
    }

    mediaRecorder.value.start()
    recording.value = true
  } catch (err) {
    console.error('🎙️ Errore microfono:', err)
    alert('Errore nell’accesso al microfono.')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
    recording.value = false
  }
}

const playSample = () => {
  if (samplePlayer.value) {
    samplePlayer.value.stop()
    samplePlayer.value.seek(0.3) 
    samplePlayer.value.play()
    console.log('▶️ Playback Howler')
  }
}

const handleMouseDown = () => {
  longPressTriggered.value = false
  pressTimer.value = setTimeout(() => {
    interval.value = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value == 0) {
        startRecording()
        clearInterval(interval.value)
      }
    }, 700)
    longPressTriggered.value = true
    countdown.value = 3;
  }, 500)
}

const handleMouseUp = () => {
  clearTimeout(pressTimer.value)
  if (longPressTriggered.value) {
    countdown.value = 0;
    clearInterval(interval.value)
    stopRecording()
  } else {
    playSample()
  }
}
</script>

<template>
  <div class="flex w-full h-[100vh] justify-center items-center">
    <button @mousedown="handleMouseDown" @mouseup="handleMouseUp" @touchstart.prevent="handleMouseDown"
      @touchend.prevent="handleMouseUp" class="w-50 h-50 rounded-full text-white text-lg transition duration-300"
      :class="recording ? 'bg-red-600' : 'bg-green-600'">
      <p v-if="countdown" class="bold text-8xl">{{ countdown }}</p>
    </button>
  </div>
</template>